import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.ts';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-950/90 border border-amber-600/40 px-3.5 py-2 text-xs font-medium text-amber-200 shadow-xl backdrop-blur-sm animate-pulse">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Offline Mode — Cached data is being used. Reconnect to sync changes.</span>
    </div>
  );
};
