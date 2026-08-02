import React, { useEffect, useRef, useState, useCallback } from 'react';
import { biometricAuthService } from '../services/BiometricAuthService';
import { BiometricStatus } from '../types';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Mic,
  MicOff,
  UserCheck,
  AlertTriangle,
  Sparkles,
  Volume2,
  CheckCircle2,
  RefreshCw,
  Key,
  ShieldCheck,
} from 'lucide-react';

interface BiometricAuthPanelProps {
  onUnlocked?: () => void;
  onLocked?: () => void;
}

export const BiometricAuthPanel: React.FC<BiometricAuthPanelProps> = ({
  onUnlocked,
  onLocked,
}) => {
  const [status, setStatus] = useState<BiometricStatus>(
    biometricAuthService.getBiometricStatus()
  );

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [spokenTranscript, setSpokenTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);

  const onUnlockedRef = useRef(onUnlocked);
  const onLockedRef = useRef(onLocked);

  useEffect(() => {
    onUnlockedRef.current = onUnlocked;
    onLockedRef.current = onLocked;
  }, [onUnlocked, onLocked]);

  // Subscribe to Biometric Service State
  useEffect(() => {
    const unsubscribe = biometricAuthService.subscribeStatus((newStatus) => {
      setStatus(newStatus);
      if (newStatus.lockState === 'unlocked' && onUnlockedRef.current) {
        onUnlockedRef.current();
      } else if (newStatus.lockState === 'locked' && onLockedRef.current) {
        onLockedRef.current();
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle Voice Recording for Enrollment or Verification
  const handleStartVoiceRecording = useCallback(async () => {
    if (isRecordingVoice) return;

    try {
      setSpokenTranscript('');
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(micStream);
      mediaRecorderRef.current = mediaRecorder;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(micStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      // Start Web Speech API Recognition concurrently if available
      let capturedText = '';
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = false;
          rec.interimResults = true;
          rec.lang = 'en-US';
          rec.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((result: any) => result[0].transcript)
              .join('');
            capturedText = transcript;
            setSpokenTranscript(transcript);
          };
          speechRecognitionRef.current = rec;
          rec.start();
        } catch (e) {
          // ignore speech rec errors
        }
      }

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let isChecking = true;
      const checkVolume = () => {
        if (!isChecking) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        setAudioVolume(sum / (dataArray.length * 255));
        requestAnimationFrame(checkVolume);
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        isChecking = false;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        micStream.getTracks().forEach((track) => track.stop());
        audioCtx.close();
        if (speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.stop();
          } catch (e) {}
        }
        setIsRecordingVoice(false);
        setAudioVolume(0);

        if (status.lockState === 'enrolling') {
          await biometricAuthService.captureEnrollmentVoiceSample(audioBlob);
        } else {
          await biometricAuthService.processVoiceVerificationSample(audioBlob, capturedText);
        }
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      checkVolume();

      // Auto-stop voice recording after 4 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 4000);
    } catch (err) {
      console.error('[BiometricAuthPanel] Mic access error:', err);
    }
  }, [status.lockState, isRecordingVoice]);

  // Handle Start Enrollment
  const handleStartEnrollment = useCallback(() => {
    biometricAuthService.startOwnerEnrollment();
  }, []);

  const handleGenerateNewPhrase = useCallback(() => {
    biometricAuthService.generateNewChallengePhrase();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl select-none">
      <div className="relative w-full max-w-lg bg-[#0B0F19]/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,232,255,0.15)] flex flex-col items-center space-y-6 text-slate-100">
        
        {/* TOP STATUS HEADER */}
        <div className="w-full flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl border ${
              status.lockState === 'unauthorized'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
            }`}>
              {status.lockState === 'unauthorized' ? (
                <ShieldAlert className="w-6 h-6" />
              ) : status.lockState === 'unlocked' ? (
                <Unlock className="w-6 h-6 text-emerald-400" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase">
                VOICE AUTHENTICATION
              </span>
              <span className="text-sm font-semibold text-slate-200">
                Owner Voice Verification
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              status.lockState === 'unauthorized'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : status.lockState === 'verifying_voice'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}>
              {status.lockState === 'uninitialized'
                ? 'UNENROLLED'
                : status.lockState === 'enrolling'
                ? 'ENROLLING'
                : status.lockState === 'verifying_voice'
                ? 'VERIFYING'
                : status.lockState === 'unauthorized'
                ? 'ACCESS DENIED'
                : 'LOCKED'}
            </span>
          </div>
        </div>

        {/* STATUS MESSAGE BOX */}
        <div className="w-full bg-black/50 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 text-xs sm:text-sm">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-slate-200 font-medium leading-relaxed">
            {status.statusMessage}
          </span>
        </div>

        {/* DYNAMIC VERIFICATION PHRASE CARD */}
        {status.lockState !== 'uninitialized' && (
          <div className="w-full bg-gradient-to-br from-cyan-950/40 via-purple-950/30 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 flex flex-col items-center space-y-3 shadow-inner">
            <div className="w-full flex items-center justify-between text-xs font-mono text-cyan-400/80">
              <span className="flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>DYNAMIC CHALLENGE PHRASE</span>
              </span>
              <button
                onClick={handleGenerateNewPhrase}
                className="hover:text-cyan-200 transition cursor-pointer flex items-center space-x-1 text-[11px]"
                title="Refresh Challenge Phrase"
              >
                <RefreshCw className="w-3 h-3" />
                <span>NEW PHRASE</span>
              </button>
            </div>

            <div className="py-2 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 drop-shadow-[0_0_20px_rgba(0,232,255,0.4)]">
                "{status.challengePhrase}"
              </span>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Please repeat this exact phrase into your microphone. Sanaya verifies speaker voice identity & phonetic accuracy.
            </p>
          </div>
        )}

        {/* LIVE AUDIO WAVEFORM & MIC VOLUME */}
        {isRecordingVoice && (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-purple-300">
              <span className="flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 animate-bounce text-purple-400" />
                <span>LISTENING TO SPEAKER...</span>
              </span>
              <span>{Math.round(audioVolume * 100)}% MIC LEVEL</span>
            </div>
            
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-purple-500/30 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full transition-all duration-75 shadow-[0_0_12px_#8B5CF6]"
                style={{ width: `${Math.min(100, audioVolume * 220)}%` }}
              />
            </div>

            {spokenTranscript && (
              <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-2.5 text-center text-xs font-mono text-purple-200">
                Transcribed: "{spokenTranscript}"
              </div>
            )}
          </div>
        )}

        {/* CONTROLS SECTION */}
        <div className="w-full space-y-3 pt-2">
          {status.lockState === 'uninitialized' ? (
            <button
              onClick={handleStartEnrollment}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 text-white font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(0,232,255,0.4)] hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>START OWNER VOICE ENROLLMENT</span>
            </button>
          ) : status.lockState === 'enrolling' ? (
            <button
              onClick={handleStartVoiceRecording}
              disabled={isRecordingVoice}
              className={`w-full py-4 px-5 rounded-2xl font-bold text-sm tracking-wider uppercase shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer ${
                isRecordingVoice
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(139,92,255,0.4)]'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span>
                {isRecordingVoice
                  ? 'RECORDING... SPEAK PHRASE'
                  : `RECORD VOICE SAMPLE (${(status.enrollmentStep || 0) + 1}/4)`}
              </span>
            </button>
          ) : (
            <button
              onClick={handleStartVoiceRecording}
              disabled={isRecordingVoice || status.lockState === 'verifying_voice'}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wider uppercase transition flex items-center justify-center space-x-3 cursor-pointer shadow-xl ${
                isRecordingVoice
                  ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_30px_rgba(244,63,94,0.5)]'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_25px_rgba(0,232,255,0.4)]'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span>
                {isRecordingVoice
                  ? 'RECORDING... REPEAT PHRASE NOW'
                  : status.lockState === 'verifying_voice'
                  ? 'VERIFYING VOICE IDENTITY...'
                  : 'VERIFY VOICE (SPEAK PHRASE)'}
              </span>
            </button>
          )}
        </div>

        {/* FOOTER METRICS SUMMARY */}
        <div className="w-full pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>SPEAKER THRESHOLD: 72%</span>
          <span>
            {status.voiceMatchScore > 0 ? (
              <span className="text-cyan-300 font-bold">
                LAST MATCH: {Math.round(status.voiceMatchScore * 100)}%
              </span>
            ) : (
              'STANDBY'
            )}
          </span>
        </div>

      </div>
    </div>
  );
};
