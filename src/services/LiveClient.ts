import { SessionStatus, TranscriptionMessage, ToolCallItem } from '../types';
import { AudioStreamer } from './AudioStreamer';
import { AudioPlayer } from './AudioPlayer';
import { ToolExecutor } from './ToolExecutor';

export interface LiveClientCallbacks {
  onStatusChange: (status: SessionStatus) => void;
  onUserVolume: (vol: number) => void;
  onSanayaVolume: (vol: number) => void;
  onTranscription: (msg: TranscriptionMessage) => void;
  onToolCall: (item: ToolCallItem) => void;
  onError: (err: string) => void;
  onAppAction?: (appName: string, actionData?: any) => void;
}

export class LiveClient {
  private ws: WebSocket | null = null;
  private streamer = new AudioStreamer();
  private player = new AudioPlayer();
  private toolExecutor = new ToolExecutor();
  private callbacks: LiveClientCallbacks;

  private status: SessionStatus = 'disconnected';
  private pingInterval: any = null;
  private autoReconnect = true;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(callbacks: LiveClientCallbacks) {
    this.callbacks = callbacks;
    if (callbacks.onAppAction) {
      this.toolExecutor.setOnAppAction(callbacks.onAppAction);
    }

    this.player.setOnVolumeCallback((vol) => {
      this.callbacks.onSanayaVolume(vol);
      if (vol > 0.05 && this.status !== 'speaking') {
        this.setStatus('speaking');
      } else if (vol <= 0.05 && this.status === 'speaking') {
        this.setStatus('listening');
      }
    });
  }

  public setSensitivity(sens: number) {
    this.streamer.setSensitivity(sens);
  }

  public setVolume(vol: number) {
    this.player.setVolume(vol);
  }

  public setAutoReconnect(auto: boolean) {
    this.autoReconnect = auto;
  }

  public sendVideoFrame(base64Jpeg: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'video',
          frame: base64Jpeg,
        })
      );
      console.log('[ScreenShare] Frame uploaded to Gemini Vision via WebSocket');
    } else {
      console.warn('[ScreenShare] Frame upload skipped: WebSocket connection is not OPEN');
    }
  }

  public sendTextMessage(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'text',
          text,
        })
      );
    }
  }

  public getStatus(): SessionStatus {
    return this.status;
  }

  public async connect(): Promise<void> {
    if (this.status === 'connecting' || this.status === 'connected' || this.status === 'listening' || this.status === 'speaking') {
      return;
    }

    this.setStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        console.log('[LiveClient] Connected to WebSocket endpoint');
        this.reconnectAttempts = 0;
        this.startPing();
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'status': {
              if (msg.status === 'connected') {
                this.setStatus('listening');
                await this.startMicrophone();
              } else if (msg.status === 'connecting') {
                this.setStatus('connecting');
              } else if (msg.status === 'disconnected') {
                this.setStatus('disconnected');
              }
              break;
            }

            case 'audio': {
              if (msg.audio) {
                if (this.status !== 'speaking') {
                  this.setStatus('speaking');
                }
                await this.player.playChunk(msg.audio);
              }
              break;
            }

            case 'transcription': {
              this.callbacks.onTranscription({
                id: `txt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                source: msg.source,
                text: msg.text,
                timestamp: Date.now(),
              });
              break;
            }

            case 'interrupted': {
              console.log('[LiveClient] Interrupted by user barge-in');
              this.player.interrupt();
              this.setStatus('interrupted');
              setTimeout(() => {
                if (this.status === 'interrupted') {
                  this.setStatus('listening');
                }
              }, 400);
              break;
            }

            case 'tool_call': {
              if (msg.functionCalls && msg.functionCalls.length > 0) {
                this.setStatus('thinking');
                const { executedItems, functionResponses } = await this.toolExecutor.executeToolCalls(msg.functionCalls);

                for (const item of executedItems) {
                  this.callbacks.onToolCall(item);
                }

                // Send tool response back to Gemini session
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                  this.ws.send(JSON.stringify({
                    type: 'tool_response',
                    functionResponses,
                  }));
                }

                setTimeout(() => {
                  if (this.status === 'thinking') {
                    this.setStatus('listening');
                  }
                }, 300);
              }
              break;
            }

            case 'turn_complete': {
              if (this.status === 'thinking' || this.status === 'speaking') {
                this.setStatus('listening');
              }
              break;
            }

            case 'error': {
              console.error('[LiveClient] Server error:', msg.message);
              this.callbacks.onError(msg.message);
              break;
            }

            default:
              break;
          }
        } catch (e: any) {
          console.error('[LiveClient] Parse message error:', e);
        }
      };

      this.ws.onerror = (evt) => {
        console.warn('[LiveClient] WS Event error:', evt);
      };

      this.ws.onclose = (event) => {
        console.log('[LiveClient] WS closed, code:', event?.code, 'reason:', event?.reason);
        this.cleanup();

        if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.setStatus('reconnecting');
          setTimeout(() => {
            if (this.status === 'reconnecting') {
              this.connect();
            }
          }, 2000 * this.reconnectAttempts);
        } else {
          this.setStatus('disconnected');
        }
      };
    } catch (err: any) {
      console.error('[LiveClient] Setup error:', err);
      this.callbacks.onError(err.message || 'Failed to establish WebSocket connection');
      this.setStatus('disconnected');
    }
  }

  public disconnect(): void {
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cleanup();
    this.setStatus('disconnected');
  }

  private async startMicrophone(): Promise<void> {
    try {
      await this.streamer.start(
        (base64Pcm) => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'audio',
              audio: base64Pcm,
            }));
          }
        },
        (userVol) => {
          this.callbacks.onUserVolume(userVol);
          // If user speaks loudly while Sanaya is speaking, notify interruption
          if (userVol > 0.35 && this.player.getIsPlaying()) {
            this.player.interrupt();
          }
        }
      );
    } catch (err: any) {
      const isPermissionError = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      const userMessage = isPermissionError
        ? 'Microphone permission denied. Please allow microphone access in your browser settings to speak with Sanaya.'
        : 'Microphone access failed: ' + (err?.message || 'Permission denied');
      console.warn('[LiveClient] Microphone start failed:', userMessage);
      this.callbacks.onError(userMessage);
    }
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private cleanup() {
    this.stopPing();
    this.streamer.stop();
    this.player.stop();
  }

  private setStatus(newStatus: SessionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.callbacks.onStatusChange(newStatus);
    }
  }
}
