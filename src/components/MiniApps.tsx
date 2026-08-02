import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, CloudSun, Calculator, Volume2, Sparkles, MapPin, RefreshCw, Navigation, Sun, CloudRain, CloudLightning, Snowflake, CloudFog, Wind, Droplets, MessageSquare, ShieldAlert } from 'lucide-react';
import { AppActionState } from '../types';
import { locationService, LocationState, WeatherData } from '../services/LocationService';

interface MiniAppsProps {
  appState: AppActionState;
  onClose: () => void;
  onAskSanayaWeather?: (msg: string) => void;
}

export const MiniApps: React.FC<MiniAppsProps> = ({ appState, onClose, onAskSanayaWeather }) => {
  const [noteText, setNoteText] = useState('Sanaya recommended keeping ideas flowing!');
  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState('0');
  const [locState, setLocState] = useState<LocationState>(locationService.getState());

  useEffect(() => {
    const unsubscribe = locationService.subscribe((updated) => {
      setLocState({ ...updated });
    });
    return () => unsubscribe();
  }, []);

  if (!appState.activeApp) return null;

  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcExpr('');
      setCalcResult('0');
    } else if (val === '=') {
      try {
        const res = Function(`'use strict'; return (${calcExpr})`)();
        setCalcResult(String(res));
      } catch (e) {
        setCalcResult('Error');
      }
    } else {
      setCalcExpr((prev) => prev + val);
    }
  };

  const handleEnableLocation = async () => {
    await locationService.enableLiveLocation();
  };

  const handleRefreshWeather = async () => {
    await locationService.fetchWeather();
  };

  const getWeatherIcon = (weather: WeatherData | null) => {
    if (!weather) return <CloudSun className="w-10 h-10 text-amber-400" />;
    const code = weather.weatherCode;
    if (code === 0 || code === 1) return <Sun className="w-10 h-10 text-amber-400 animate-spin-slow" />;
    if (code === 2 || code === 3) return <CloudSun className="w-10 h-10 text-cyan-300" />;
    if (code >= 51 && code <= 65) return <CloudRain className="w-10 h-10 text-blue-400" />;
    if (code >= 95) return <CloudLightning className="w-10 h-10 text-amber-300" />;
    if (code >= 71 && code <= 77) return <Snowflake className="w-10 h-10 text-cyan-100" />;
    if (code === 45 || code === 48) return <CloudFog className="w-10 h-10 text-slate-300" />;
    return <CloudSun className="w-10 h-10 text-amber-400" />;
  };

  const getSanayaCommentary = (weather: WeatherData | null) => {
    if (!weather) return "Sanaya is ready to check the weather with you once location permission is granted!";
    const cond = weather.condition.toLowerCase();
    if (cond.includes('sun') || cond.includes('clear')) {
      return `A lovely, bright day in ${weather.city || 'your city'}! Perfect sunshine for a walk or grabbing a coffee while we talk.`;
    }
    if (cond.includes('rain') || cond.includes('drizzle')) {
      return `Soft rain falling in ${weather.city || 'your area'}. Cozy indoor vibes! How about a cup of warm tea or chai?`;
    }
    if (cond.includes('snow')) {
      return `It's chilly and snowy outside in ${weather.city || 'your location'}! Wrap up warm in a cozy jacket.`;
    }
    if (cond.includes('thunder')) {
      return `Thunderstorms around ${weather.city || 'your area'}. Stay safe indoors and chill with Sanaya!`;
    }
    return `Currently ${weather.temperature}°C with ${weather.condition} in ${weather.city || 'your location'}. Glad to be hanging out with you!`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full max-w-lg bg-slate-900/90 border border-white/20 rounded-3xl p-6 shadow-2xl relative text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold capitalize">
                {appState.activeApp === 'notes' && 'Sanaya Quick Scratchpad'}
                {appState.activeApp === 'weather' && 'Sanaya Weather Glance'}
                {appState.activeApp === 'calc' && 'Quick Voice Calculator'}
                {appState.activeApp === 'soundboard' && 'Interactive Soundboard'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* App Body */}
          <div className="mt-4">
            {appState.activeApp === 'notes' && (
              <div className="space-y-3">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type or speak notes to Sanaya..."
                  className="w-full h-36 bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Saved locally in memory</span>
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-medium"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}

            {appState.activeApp === 'weather' && (
              <div className="space-y-4 py-2">
                {locState.enabled && locState.weather ? (
                  <div className="space-y-4">
                    {/* MAIN WEATHER CARD */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-300">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-bold truncate max-w-[200px]">
                            {locState.weather.city || 'Your Location'}{locState.weather.country ? `, ${locState.weather.country}` : ''}
                          </span>
                        </div>
                        <button
                          onClick={handleRefreshWeather}
                          disabled={locState.isFetchingWeather}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
                          title="Refresh weather"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${locState.isFetchingWeather ? 'animate-spin text-cyan-400' : ''}`} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20">
                            {getWeatherIcon(locState.weather)}
                          </div>
                          <div>
                            <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                              {locState.weather.temperature}°C <span className="text-sm font-normal text-slate-400">/ {locState.weather.temperatureF}°F</span>
                            </div>
                            <div className="text-xs font-medium text-cyan-300">
                              {locState.weather.condition}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-[11px] font-mono text-slate-400 space-y-1">
                          <div className="flex items-center justify-end space-x-1">
                            <Wind className="w-3 h-3 text-cyan-400" />
                            <span>{locState.weather.windSpeed} km/h</span>
                          </div>
                          <div className="flex items-center justify-end space-x-1">
                            <Droplets className="w-3 h-3 text-blue-400" />
                            <span>Humidity {locState.weather.humidity}%</span>
                          </div>
                        </div>
                      </div>

                      {/* 4-HOUR FORECAST PREVIEW */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center text-xs font-mono">
                        {[
                          { label: 'Morning', temp: `${locState.weather.temperature - 2}°C`, icon: '🌅' },
                          { label: 'Noon', temp: `${locState.weather.temperature + 1}°C`, icon: '☀️' },
                          { label: 'Evening', temp: `${locState.weather.temperature}°C`, icon: '🌆' },
                          { label: 'Night', temp: `${locState.weather.temperature - 4}°C`, icon: '🌙' },
                        ].map((item, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <div className="text-[10px] text-slate-400">{item.label}</div>
                            <div className="my-0.5 text-base">{item.icon}</div>
                            <div className="text-white font-bold text-[11px]">{item.temp}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SANAYA COMMENTARY & ACTION */}
                    <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span>Sanaya's Weather Perspective</span>
                        </div>
                        {onAskSanayaWeather && (
                          <button
                            onClick={() => {
                              if (locState.weather) {
                                const msg = `Hey Sanaya, the weather in ${locState.weather.city || 'my city'} is currently ${locState.weather.temperature}°C and ${locState.weather.condition}. What do you think about today's weather?`;
                                onAskSanayaWeather(msg);
                                onClose();
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition shadow"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Ask Sanaya</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{getSanayaCommentary(locState.weather)}"
                      </p>
                    </div>
                  </div>
                ) : (
                  /* NO LOCATION / PERMISSION PROMPT CARD */
                  <div className="text-center py-6 px-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Live Location Required</h3>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                        Grant location permission to fetch real-time weather for your exact city and enable Sanaya to acknowledge local climate updates in voice!
                      </p>
                    </div>

                    <button
                      onClick={handleEnableLocation}
                      disabled={locState.isLocating}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold font-mono transition cursor-pointer shadow-lg flex items-center justify-center space-x-2 mx-auto"
                    >
                      {locState.isLocating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Locating GPS...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 h-4" />
                          <span>Enable Live GPS Location</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {appState.activeApp === 'calc' && (
              <div className="space-y-3">
                <div className="bg-slate-950 p-4 rounded-2xl text-right font-mono">
                  <div className="text-xs text-slate-400 h-5">{calcExpr || '0'}</div>
                  <div className="text-2xl font-bold text-emerald-400">{calcResult}</div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+'].map(
                    (btn) => (
                      <button
                        key={btn}
                        onClick={() => handleCalcClick(btn)}
                        className={`p-3 rounded-xl font-bold text-sm transition ${
                          btn === '='
                            ? 'bg-purple-600 text-white'
                            : btn === 'C'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {btn}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {appState.activeApp === 'soundboard' && (
              <div className="grid grid-cols-2 gap-3 py-2">
                {[
                  { name: '✨ Sparkle', sound: 'pleasant shine' },
                  { name: '🎉 Celebration', sound: 'applause' },
                  { name: '💡 Idea Ping', sound: 'ding' },
                  { name: '🔥 Fire Up', sound: 'whoosh' },
                ].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const audioCtx = new AudioContext();
                      const osc = audioCtx.createOscillator();
                      const gain = audioCtx.createGain();
                      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
                      osc.frequency.value = 400 + idx * 200;
                      osc.connect(gain);
                      gain.connect(audioCtx.destination);
                      osc.start();
                      gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
                      osc.stop(audioCtx.currentTime + 0.5);
                    }}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-pink-500/50 text-left transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-400">{s.sound}</div>
                    </div>
                    <Volume2 className="w-4 h-4 text-pink-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
