import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-12 left-4 sm:left-6 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg border border-amber-400/40 animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-100" />
      <span>Offline Mode — Cached calculations and plans remain accessible</span>
    </div>
  );
};
