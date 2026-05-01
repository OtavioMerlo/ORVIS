import React from 'react';
import { Wifi, WifiOff, Server, Activity } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const StatusBar: React.FC = () => {
  const { isOnline, sessionId, messages } = useChatStore();

  return (
    <div className="px-4 py-1.5 bg-background/90 border-t border-primary/5 flex items-center justify-between text-[9px] font-mono text-muted/40 tracking-wider uppercase z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <Wifi size={10} className="text-neon-green" />
          ) : (
            <WifiOff size={10} className="text-accent" />
          )}
          <span>{isOnline ? 'Connected' : 'Offline'}</span>
        </div>

        <div className="w-px h-3 bg-primary/10" />

        <div className="flex items-center gap-1.5">
          <Server size={10} />
          <span>Session: {sessionId?.slice(-6) || '—'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Activity size={10} />
          <span>{messages.length} msgs</span>
        </div>

        <div className="w-px h-3 bg-primary/10" />

        <span className="hidden md:inline">ORVIS Neural Engine v1.0</span>
      </div>
    </div>
  );
};

export default StatusBar;
