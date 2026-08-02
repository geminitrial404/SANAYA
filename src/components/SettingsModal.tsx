import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, Mic, RotateCcw, Sliders, UserCheck, Shield, Lock, Trash2, Key, Clock, RefreshCw, MapPin, Navigation, ShieldCheck, AlertCircle } from 'lucide-react';
import { VoiceSettings } from '../types';
import { biometricAuthService } from '../services/BiometricAuthService';
import { locationService, LocationState } from '../services/LocationService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: Partial<VoiceSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'security' | 'location'>('voice');
  const [locState, setLocState] = useState<LocationState>(locationService.getState());
  const [newPhrase, setNewPhrase] = useState(
    biometricAuthService.getBiometricStatus().verificationPhrase
  );
  const [phraseSavedMsg, setPhraseSavedMsg] = useState('');

  useEffect(() => {
    const unsubscribe = locationService.subscribe((updated) => {
      setLocState({ ...updated });
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const bioStatus = biometricAuthService.getBiometricStatus();

  const handleSavePhrase = () => {
    if (newPhrase.trim().length > 3) {
      biometricAuthService.updateVerificationPhrase(newPhrase.trim());
      setPhraseSavedMsg('Verification phrase updated!');
      setTimeout(() => setPhraseSavedMsg(''), 2500);
    }
  };

  const handleLockNow = () => {
    biometricAuthService.lockNow('Manually locked from Security Settings.');
    onClose();
  };

  const handleResetBiometrics = () => {
    if (confirm('Are you sure you want to reset all stored owner biometric embeddings?')) {
      biometricAuthService.resetBiometricData();
      onClose();
    }
  };

  const handleReRegisterFace = () => {
    biometricAuthService.startOwnerEnrollment();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('voice')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                  activeTab === 'voice'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Voice Settings</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Security & Biometrics</span>
              </button>
              <button
                onClick={() => setActiveTab('location')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                  activeTab === 'location'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Live Location</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls Body */}
          {activeTab === 'voice' ? (
            <div className="mt-5 space-y-5 text-sm">
              {/* Playback Volume */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-medium flex items-center space-x-1.5">
                    <Volume2 className="w-4 h-4 text-pink-400" />
                    <span>Sanaya Speech Volume</span>
                  </label>
                  <span className="text-xs text-purple-300 font-mono">
                    {Math.round(settings.playbackVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.playbackVolume}
                  onChange={(e) => onUpdateSettings({ playbackVolume: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Mic Sensitivity */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-medium flex items-center space-x-1.5">
                    <Mic className="w-4 h-4 text-cyan-400" />
                    <span>Microphone Sensitivity</span>
                  </label>
                  <span className="text-xs text-cyan-300 font-mono">
                    {settings.micSensitivity.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.micSensitivity}
                  onChange={(e) => onUpdateSettings({ micSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Prebuilt Voice Selection */}
              <div>
                <label className="text-slate-300 font-medium flex items-center space-x-1.5 mb-2">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>Voice Persona Tone</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'Kore', label: 'Warm & Confident' },
                    { name: 'Zephyr', label: 'Witty & Bright' },
                    { name: 'Aoede', label: 'Playful & Soft' },
                  ].map((v) => (
                    <button
                      key={v.name}
                      onClick={() => onUpdateSettings({ selectedVoice: v.name })}
                      className={`p-2 rounded-xl text-center text-xs transition border cursor-pointer ${
                        settings.selectedVoice === v.name
                          ? 'bg-purple-600/30 text-purple-200 border-purple-500'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold">{v.name}</div>
                      <div className="text-[10px] text-slate-400">{v.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Auto-Reconnect on Drop</span>
                  <input
                    type="checkbox"
                    checked={settings.autoReconnect}
                    onChange={(e) => onUpdateSettings({ autoReconnect: e.target.checked })}
                    className="w-4 h-4 accent-purple-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Natural Hinglish & Colloquialisms</span>
                  <input
                    type="checkbox"
                    checked={settings.hinglishMode}
                    onChange={(e) => onUpdateSettings({ hinglishMode: e.target.checked })}
                    className="w-4 h-4 accent-pink-500 rounded"
                  />
                </label>
              </div>
            </div>
          ) : activeTab === 'security' ? (
            <div className="mt-5 space-y-5 text-sm">
              {/* LOCK NOW & RE-REGISTER BUTTONS */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleLockNow}
                  className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-semibold text-xs flex items-center justify-center space-x-2 cursor-pointer transition"
                >
                  <Lock className="w-4 h-4" />
                  <span>Lock Sanaya Now</span>
                </button>

                <button
                  onClick={handleReRegisterFace}
                  className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 font-semibold text-xs flex items-center justify-center space-x-2 cursor-pointer transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Re-register Voice Identity</span>
                </button>
              </div>

              {/* CHANGE VERIFICATION PHRASE */}
              <div className="space-y-2">
                <label className="text-slate-300 font-medium flex items-center space-x-1.5">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>Voice Verification Phrase</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newPhrase}
                    onChange={(e) => setNewPhrase(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSavePhrase}
                    className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs cursor-pointer transition"
                  >
                    Save
                  </button>
                </div>
                {phraseSavedMsg && (
                  <p className="text-[11px] text-emerald-400 font-mono">{phraseSavedMsg}</p>
                )}
              </div>

              {/* AUTO-LOCK TIMEOUT SETTING */}
              <div>
                <label className="text-slate-300 font-medium flex items-center space-x-1.5 mb-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Auto-Lock Timeout (When Owner Leaves Camera)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '30s', sec: 30 },
                    { label: '1 Min', sec: 60 },
                    { label: '2 Mins', sec: 120 },
                    { label: '5 Mins', sec: 300 },
                  ].map((t) => (
                    <button
                      key={t.sec}
                      onClick={() => {
                        biometricAuthService.setAutoLockTimeoutSec(t.sec);
                        onUpdateSettings({ autoLockTimeoutSec: t.sec });
                      }}
                      className={`py-2 rounded-xl text-center text-xs font-mono font-bold transition border cursor-pointer ${
                        bioStatus.autoLockTimeoutSec === t.sec
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DANGER ZONE: RESET BIOMETRIC DATA */}
              <div className="pt-3 border-t border-rose-500/20">
                <button
                  onClick={handleResetBiometrics}
                  className="w-full py-2.5 px-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 font-semibold text-xs flex items-center justify-center space-x-2 cursor-pointer transition"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Reset All Biometric Embeddings</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-5 text-sm">
              {/* LIVE LOCATION PERMISSION TOGGLE */}
              <div className="bg-black/40 rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-white text-xs">Live GPS Location Sharing</h4>
                      <p className="text-[11px] text-slate-400">Allow Sanaya to access real-time location coordinates</p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (locState.enabled) {
                        locationService.disableLiveLocation();
                      } else {
                        await locationService.enableLiveLocation();
                      }
                    }}
                    className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition cursor-pointer border ${
                      locState.enabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {locState.enabled ? 'Enabled' : 'Enable Location'}
                  </button>
                </div>

                {/* CURRENT LOCATION DETAILS */}
                {locState.enabled && locState.location ? (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 font-mono text-xs">
                    <div className="text-emerald-300 font-bold flex items-center space-x-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{locState.location.formattedAddress || 'Location Acquired'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>Latitude: <strong className="text-white">{locState.location.latitude.toFixed(6)}°</strong></div>
                      <div>Longitude: <strong className="text-white">{locState.location.longitude.toFixed(6)}°</strong></div>
                      <div>GPS Accuracy: <strong className="text-white">~{locState.location.accuracy} meters</strong></div>
                      <div>Status: <strong className="text-emerald-400">Active Tracking</strong></div>
                    </div>
                  </div>
                ) : locState.isLocating ? (
                  <div className="text-amber-400 text-xs font-mono animate-pulse flex items-center space-x-2 pt-2 border-t border-slate-800">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Requesting browser location permission...</span>
                  </div>
                ) : locState.error ? (
                  <div className="text-rose-400 text-xs font-mono flex items-center space-x-2 pt-2 border-t border-slate-800">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{locState.error}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                    When enabled, Sanaya can give localized answers for nearby weather, recommendations, and context.
                  </p>
                )}
              </div>

              {/* PRIVACY GUARANTEE */}
              <div className="bg-slate-900/60 rounded-2xl p-3 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex items-center space-x-1.5 text-cyan-300 font-mono font-bold">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Privacy Notice</span>
                </div>
                <p>
                  Location permissions are strictly stored locally on your device and never sold or transmitted to 3rd party advertising networks.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

