import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import { locationService, LocationState } from '../services/LocationService';

export const LiveLocationBadge: React.FC = () => {
  const [locState, setLocState] = useState<LocationState>(locationService.getState());
  const [isOpenTooltip, setIsOpenTooltip] = useState(false);

  useEffect(() => {
    const unsubscribe = locationService.subscribe((updated) => {
      setLocState({ ...updated });
    });
    return () => unsubscribe();
  }, []);

  const handleTogglePermission = async () => {
    if (locState.enabled) {
      locationService.disableLiveLocation();
    } else {
      await locationService.enableLiveLocation();
    }
  };

  const getStatusText = () => {
    if (locState.isLocating) return 'Locating GPS...';
    if (!locState.enabled) return 'Location Off';
    if (locState.location?.city) return `${locState.location.city}${locState.location.country ? `, ${locState.location.country}` : ''}`;
    if (locState.location) return `${locState.location.latitude.toFixed(2)}°, ${locState.location.longitude.toFixed(2)}°`;
    if (locState.permission === 'denied') return 'Permission Denied';
    return 'Permission Request';
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleTogglePermission}
        onMouseEnter={() => setIsOpenTooltip(true)}
        onMouseLeave={() => setIsOpenTooltip(false)}
        className={`px-2.5 py-1.5 rounded-xl border font-mono text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
          locState.enabled && locState.location
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            : locState.isLocating
            ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
            : locState.permission === 'denied'
            ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40'
        }`}
        title="Live Location Permission"
      >
        <MapPin className={`w-3.5 h-3.5 ${locState.enabled ? 'text-emerald-400 animate-bounce' : 'text-slate-400'}`} />
        <span className="truncate max-w-[120px] sm:max-w-[160px] text-[11px]">{getStatusText()}</span>
      </button>

      {/* QUICK TOOLTIP POPUP */}
      {isOpenTooltip && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 p-3 rounded-2xl bg-slate-950/95 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.8)] text-xs text-slate-300 space-y-2 pointer-events-none">
          <div className="flex items-center justify-between font-mono font-bold text-white border-b border-slate-800 pb-1.5">
            <span className="flex items-center space-x-1.5">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>LIVE GPS LOCATION</span>
            </span>
            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${locState.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
              {locState.permission}
            </span>
          </div>

          {locState.location ? (
            <div className="space-y-1 font-mono text-[11px]">
              <div className="text-cyan-300 font-bold truncate">
                {locState.location.formattedAddress || `${locState.location.latitude}, ${locState.location.longitude}`}
              </div>
              <div className="text-slate-400 text-[10px] flex justify-between">
                <span>Lat: {locState.location.latitude.toFixed(4)}°</span>
                <span>Lon: {locState.location.longitude.toFixed(4)}°</span>
              </div>
              <div className="text-slate-500 text-[9px]">
                GPS Accuracy: ~{locState.location.accuracy}m
              </div>
            </div>
          ) : locState.error ? (
            <div className="text-rose-400 text-[11px] flex items-start space-x-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{locState.error}</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              Click to grant live location permission for location-aware conversations with Sanaya.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
