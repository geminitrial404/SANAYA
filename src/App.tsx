import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveClient } from './services/LiveClient';
import {
  SessionStatus,
  TranscriptionMessage,
  ToolCallItem,
  VoiceSettings,
  AppActionState,
  BiometricStatus,
  EmotionalIntelligence,
} from './types';
import {
  screenShareManager,
  ScreenShareState,
} from './services/ScreenShareManager';
import { biometricAuthService } from './services/BiometricAuthService';
import { BiometricAuthPanel } from './components/BiometricAuthPanel';
import { BackgroundParticles } from './components/BackgroundParticles';
import { StatusHeader } from './components/StatusHeader';
import { LeftHUDPanel } from './components/LeftHUDPanel';
import { RightHUDPanel } from './components/RightHUDPanel';
import { SanayaHologramStage } from './components/SanayaHologramStage';
import { BottomVoiceDock } from './components/BottomVoiceDock';
import { SettingsModal } from './components/SettingsModal';
import { MemoryBankModal } from './components/MemoryBankModal';
import { RelationshipModal } from './components/RelationshipModal';
import { relationshipService } from './services/RelationshipService';
import { MiniApps } from './components/MiniApps';
import { ScreenShareWidget } from './components/ScreenShareWidget';
import { AlertTriangle, Lock } from 'lucide-react';

export default function App() {
  const [status, setStatus] = useState<SessionStatus>('disconnected');
  const [userVolume, setUserVolume] = useState(0);
  const [sanayaVolume, setSanayaVolume] = useState(0);
  const [transcriptions, setTranscriptions] = useState<TranscriptionMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [bioStatus, setBioStatus] = useState<BiometricStatus>(
    biometricAuthService.getBiometricStatus()
  );

  const [emotionalIntel, setEmotionalIntel] = useState<EmotionalIntelligence>({
    currentEmotion: 'Happy',
    smileScore: 85,
    eyeContact: 90,
    attentionLevel: 85,
    engagementLevel: 85,
    moodEstimation: 'Feeling Happy & Engaged',
    headPose: { yaw: 0, pitch: 0, roll: 0 },
    lastAnalyzed: Date.now(),
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryBankOpen, setIsMemoryBankOpen] = useState(false);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);
  const [appState, setAppState] = useState<AppActionState>({ activeApp: null });

  const [settings, setSettings] = useState<VoiceSettings>({
    micSensitivity: 1.0,
    playbackVolume: 1.0,
    autoReconnect: true,
    selectedVoice: 'Kore',
    hinglishMode: true,
    autoLockTimeoutSec: 60,
  });

  const [screenShareState, setScreenShareState] = useState<ScreenShareState>(
    screenShareManager.getState()
  );

  const liveClientRef = useRef<LiveClient | null>(null);
  const lastUserVolRef = useRef(0);
  const lastSanayaVolRef = useRef(0);

  // Subscribe to Biometric Auth Service State
  useEffect(() => {
    const unsubscribeStatus = biometricAuthService.subscribeStatus((newBio) => {
      setBioStatus(newBio);
      // Disconnect Gemini Live if locked
      if (newBio.lockState !== 'unlocked' && liveClientRef.current) {
        liveClientRef.current.disconnect();
      }
    });

    const unsubscribeEmotion = biometricAuthService.subscribeEmotionalIntelligence((intel) => {
      setEmotionalIntel(intel);
      if (intel && intel.currentEmotion) {
        relationshipService.recordCameraEmotion(intel.currentEmotion, intel.smileScore || 80);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeEmotion();
    };
  }, []);

  // Post-login camera loop for Emotional Intelligence & Visual Interaction ONLY
  useEffect(() => {
    if (bioStatus.lockState !== 'unlocked') return;

    let active = true;
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    video.autoplay = true;
    video.playsInline = true;

    async function startPostLoginVision() {
      const stream = await biometricAuthService.startCameraStream();
      if (stream && active) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
    }

    startPostLoginVision();

    const interval = setInterval(() => {
      if (!active || video.readyState < 2) return;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        biometricAuthService.evaluateEmotionalIntelligence(canvas);
      }
    }, 1200);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [bioStatus.lockState]);

  // Subscribe to screen share state changes

  useEffect(() => {
    screenShareManager.setStateCallback((newState) => {
      setScreenShareState(newState);
      if (newState.error) {
        setErrorMessage(newState.error);
      }
    });
  }, []);

  // Initialize LiveClient instance
  useEffect(() => {
    const client = new LiveClient({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'connected' || newStatus === 'listening') {
          setErrorMessage(null);
        }
      },
      onUserVolume: (vol) => {
        if (Math.abs(vol - lastUserVolRef.current) > 0.005) {
          lastUserVolRef.current = vol;
          setUserVolume(vol);
        }
      },
      onSanayaVolume: (vol) => {
        if (Math.abs(vol - lastSanayaVolRef.current) > 0.005) {
          lastSanayaVolRef.current = vol;
          setSanayaVolume(vol);
        }
      },
      onTranscription: (msg) => {
        setTranscriptions((prev) => [...prev.slice(-30), msg]);
        if (msg && msg.text) {
          relationshipService.recordConversationMessage(msg.source, msg.text);
        }
      },
      onToolCall: (item) => {
        setToolCalls((prev) => [...prev.slice(-20), item]);
        if (item && item.name === 'saveMemory') {
          relationshipService.recordMemorySaved();
        }
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onAppAction: (appName, actionData) => {
        if (appName === 'memory') {
          setIsMemoryBankOpen(true);
        } else if (['notes', 'weather', 'calc', 'soundboard', 'theme'].includes(appName)) {
          setAppState({
            activeApp: appName as any,
            data: actionData,
          });
        }
      },
    });

    liveClientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, []);

  // Update voice settings dynamically
  const handleUpdateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (liveClientRef.current) {
        if (newSettings.micSensitivity !== undefined) {
          liveClientRef.current.setSensitivity(newSettings.micSensitivity);
        }
        if (newSettings.playbackVolume !== undefined) {
          liveClientRef.current.setVolume(newSettings.playbackVolume);
        }
        if (newSettings.autoReconnect !== undefined) {
          liveClientRef.current.setAutoReconnect(newSettings.autoReconnect);
        }
      }
      return updated;
    });
  }, []);

  // Toggle connection session
  const handleToggleConnection = useCallback(async () => {
    if (!liveClientRef.current) return;

    const currentStatus = liveClientRef.current.getStatus();
    if (
      currentStatus === 'listening' ||
      currentStatus === 'speaking' ||
      currentStatus === 'thinking' ||
      currentStatus === 'interrupted' ||
      currentStatus === 'connecting'
    ) {
      liveClientRef.current.disconnect();
    } else {
      setErrorMessage(null);
      await liveClientRef.current.connect();
    }
  }, []);

  const handleBiometricUnlocked = useCallback(() => {
    console.log('[App] Biometric Auth Succeeded: Welcome back Jay!');
    if (!liveClientRef.current || liveClientRef.current.getStatus() === 'disconnected') {
      handleToggleConnection();
    }
  }, [handleToggleConnection]);

  // Toggle mic mute
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMute = !prev;
      if (liveClientRef.current) {
        liveClientRef.current.setSensitivity(nextMute ? 0 : settings.micSensitivity);
      }
      return nextMute;
    });
  }, [settings.micSensitivity]);

  const isConnected =
    status === 'listening' || status === 'speaking' || status === 'thinking' || status === 'interrupted';

  // Screen Share Handlers
  const handleStartScreenShare = useCallback(async () => {
    // Invoke display media picker IMMEDIATELY inside user gesture click handler
    const success = await screenShareManager.startSharing((frameBase64) => {
      if (liveClientRef.current) {
        liveClientRef.current.sendVideoFrame(frameBase64);
      }
    });

    if (success) {
      setErrorMessage(null);

      // Connect live AI audio session if not connected yet
      if (!liveClientRef.current || liveClientRef.current.getStatus() === 'disconnected') {
        handleToggleConnection().then(() => {
          setTimeout(() => {
            if (liveClientRef.current) {
              liveClientRef.current.sendTextMessage(
                "[SYSTEM: User started sharing their screen. Sanaya, please announce warmly out loud: 'I can now see your shared screen. Ask me anything about what you're showing.']"
              );
            }
          }, 1000);
        });
      } else {
        setTimeout(() => {
          if (liveClientRef.current) {
            liveClientRef.current.sendTextMessage(
              "[SYSTEM: User started sharing their screen. Sanaya, please announce warmly out loud: 'I can now see your shared screen. Ask me anything about what you're showing.']"
            );
          }
        }, 1000);
      }
    } else {
      const err = screenShareManager.getState().error;
      if (err) setErrorMessage(err);
    }
  }, [handleToggleConnection]);

  const handlePauseScreenShare = useCallback(() => {
    screenShareManager.pauseSharing();
  }, []);

  const handleResumeScreenShare = useCallback(() => {
    screenShareManager.resumeSharing();
  }, []);

  const handleStopScreenShare = useCallback(() => {
    screenShareManager.stopSharing();
    if (liveClientRef.current) {
      liveClientRef.current.sendTextMessage(
        "[SYSTEM: User stopped screen sharing. Sanaya, please announce naturally out loud: 'I can no longer see your screen.']"
      );
    }
  }, []);

  const handleSwitchScreenShare = useCallback(async () => {
    await screenShareManager.switchScreen();
  }, []);

  const handleAskSanayaAboutScreen = useCallback(
    async (question: string) => {
      if (!liveClientRef.current || liveClientRef.current.getStatus() === 'disconnected') {
        await handleToggleConnection();
      }
      if (liveClientRef.current) {
        liveClientRef.current.sendTextMessage(question);
      }
    },
    [handleToggleConnection]
  );

  const handleAskSanayaAboutWeather = useCallback(
    async (msg: string) => {
      if (!liveClientRef.current || liveClientRef.current.getStatus() === 'disconnected') {
        await handleToggleConnection();
      }
      setTimeout(() => {
        if (liveClientRef.current) {
          liveClientRef.current.sendTextMessage(msg);
        }
      }, 800);
    },
    [handleToggleConnection]
  );

  // Weather update listener
  useEffect(() => {
    const handleWeatherUpdated = (e: Event) => {
      const customEvt = e as CustomEvent;
      const weather = customEvt.detail?.weather;
      const city = customEvt.detail?.city || "the user's location";

      if (weather && liveClientRef.current && liveClientRef.current.getStatus() !== 'disconnected') {
        const updateText = `[SYSTEM NOTICE: Live weather updated in ${city}: ${weather.temperature}°C (${weather.temperatureF}°F), ${weather.condition}, wind ${weather.windSpeed} km/h. Sanaya, naturally acknowledge this local weather change in your dialogue!]`;
        liveClientRef.current.sendTextMessage(updateText);
      }
    };

    window.addEventListener('sanaya_weather_updated', handleWeatherUpdated);
    return () => window.removeEventListener('sanaya_weather_updated', handleWeatherUpdated);
  }, []);

  const handleOpenSettings = useCallback(() => setIsSettingsOpen(true), []);
  const handleCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const handleOpenMemoryBank = useCallback(() => setIsMemoryBankOpen(true), []);
  const handleCloseMemoryBank = useCallback(() => setIsMemoryBankOpen(false), []);
  const handleCloseMiniApps = useCallback(() => setAppState({ activeApp: null }), []);

  // Accumulate active session time for Relationship System
  useEffect(() => {
    if (status !== 'connected' && status !== 'speaking' && status !== 'listening') return;
    const interval = setInterval(() => {
      relationshipService.addSessionTimeMinutes(1);
    }, 60000);
    return () => clearInterval(interval);
  }, [status]);

  const handlePromptClick = useCallback(() => {
    if (!isConnected) {
      handleToggleConnection();
    }
  }, [isConnected, handleToggleConnection]);

  return (
    <div className="relative min-h-screen h-screen bg-[#03040B] text-slate-100 font-sans overflow-hidden flex flex-col justify-between select-none">
      {/* 1. BACKGROUND FLOATING PARTICLES & DUST */}
      <BackgroundParticles
        status={status}
        userVolume={userVolume}
        sanayaVolume={sanayaVolume}
      />

      {/* 2. TOP HEADER NAVIGATION BAR */}
      <StatusHeader
        status={status}
        isMuted={isMuted}
        screenShareState={screenShareState}
        onStartScreenShare={handleStartScreenShare}
        onStopScreenShare={handleStopScreenShare}
        onToggleMute={handleToggleMute}
        onOpenSettings={handleOpenSettings}
        onOpenMemoryBank={handleOpenMemoryBank}
        onOpenRelationship={() => setIsRelationshipOpen(true)}
      />

      {/* ERROR TOAST NOTIFICATION */}
      {errorMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
          <div className="bg-rose-500/20 border border-rose-500/40 rounded-2xl p-3 backdrop-blur-2xl flex items-center justify-between text-rose-200 text-xs shadow-2xl">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-300 hover:text-white font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE GRID: LEFT HUD + CENTER HOLOGRAM STAGE + RIGHT HUD */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between overflow-hidden">
        {/* LEFT HUD PANEL (HIDDEN ON SMALL MOBILE, VISIBLE ON MD+) */}
        <div className="hidden md:flex shrink-0">
          <LeftHUDPanel
            status={status}
            userVolume={userVolume}
            sanayaVolume={sanayaVolume}
            screenShareState={screenShareState}
            emotionalIntelligence={emotionalIntel}
            onStartScreenShare={handleStartScreenShare}
            onStopScreenShare={handleStopScreenShare}
            onOpenMemoryBank={handleOpenMemoryBank}
            onOpenSettings={handleOpenSettings}
            onOpenRelationship={() => setIsRelationshipOpen(true)}
          />
        </div>

        {/* CENTER STAGE: SANAYA HOLOGRAM AVATAR & PROJECTION PLATFORM */}
        <div className="flex-1 h-full flex items-center justify-center relative">
          <SanayaHologramStage
            status={status}
            userVolume={userVolume}
            sanayaVolume={sanayaVolume}
          />
        </div>

        {/* RIGHT HUD PANEL (HIDDEN ON SMALL MOBILE, VISIBLE ON LG+) */}
        <div className="hidden lg:flex shrink-0">
          <RightHUDPanel
            transcriptions={transcriptions}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenMemoryBank={handleOpenMemoryBank}
          />
        </div>
      </main>

      {/* 4. BOTTOM FLOATING VOICE DOCK */}
      <div className="relative z-20 pb-4 sm:pb-6 pt-2">
        <BottomVoiceDock
          status={status}
          userVolume={userVolume}
          sanayaVolume={sanayaVolume}
          onToggleConnection={handleToggleConnection}
        />
      </div>

      {/* MODALS & OVERLAYS */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <MemoryBankModal
        isOpen={isMemoryBankOpen}
        onClose={handleCloseMemoryBank}
        onAskSanayaAboutMemories={handlePromptClick}
      />

      <RelationshipModal
        isOpen={isRelationshipOpen}
        onClose={() => setIsRelationshipOpen(false)}
      />

      <MiniApps
        appState={appState}
        onClose={handleCloseMiniApps}
        onAskSanayaWeather={handleAskSanayaAboutWeather}
      />

      {/* FLOATING SCREEN SHARE WIDGET */}
      <ScreenShareWidget
        state={screenShareState}
        onPause={handlePauseScreenShare}
        onResume={handleResumeScreenShare}
        onStop={handleStopScreenShare}
        onSwitch={handleSwitchScreenShare}
        onAskSanaya={handleAskSanayaAboutScreen}
      />

      {/* BIOMETRIC AUTHENTICATION PANEL OVERLAY WHEN LOCKED */}
      {bioStatus.lockState !== 'unlocked' && (
        <BiometricAuthPanel onUnlocked={handleBiometricUnlocked} />
      )}
    </div>
  );
}

