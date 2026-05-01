import React, { useState, useEffect } from 'react';
import { Trash2, Clock, Brain, ListTodo, Volume2 } from 'lucide-react';
import NeonZap from './NeonZap';
import { useChatStore } from '../store/useChatStore';

const Header: React.FC = () => {
  const { isOnline, isThinking, clearHistory } = useChatStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <header className="px-4 md:px-6 py-3 border-b border-primary/10 bg-background/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
      {/* Left: Logo & Status */}
      <div className="flex items-center gap-3">
        <div className="relative group cursor-pointer">
          <div className="w-11 h-11 bg-primary/5 rounded-xl flex items-center justify-center border border-primary/30 transition-all duration-500 group-hover:shadow-neon group-hover:border-primary/60">
            <NeonZap size={22} />
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background transition-all duration-300 ${isOnline ? 'status-dot--online' : 'status-dot--offline'}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-orbitron m-0 leading-none tracking-widest animate-glitch">
              Orvis
            </h1>
            <span className="text-[9px] font-mono bg-secondary/15 text-secondary border border-secondary/30 px-1.5 py-0.5 rounded-md uppercase tracking-wider hidden md:inline-block">
              v1.0
            </span>
          </div>
          <p className="text-[10px] font-mono tracking-widest text-primary/50 uppercase mt-0.5">
            {isThinking ? (
              <span className="text-accent">
                <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full mr-1 animate-pulse" />
                Neural Processing...
              </span>
            ) : (
              'Systems Operational'
            )}
          </p>
        </div>
      </div>

      {/* Center: System Stats (desktop only) */}
      <div className="hidden lg:flex items-center gap-6 text-[10px] font-mono text-muted uppercase tracking-wider">
        <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-default">
          <Brain size={12} className="text-secondary" />
          <span>Memory Active</span>
        </div>
        <div className="w-px h-4 bg-primary/10" />
        <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-default">
          <ListTodo size={12} className="text-neon-green" />
          <span>Tasks Online</span>
        </div>
        <div className="w-px h-4 bg-primary/10" />
        <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-default">
          <Volume2 size={12} className="text-neon-pink" />
          <span>Audio Ready</span>
        </div>
      </div>

      {/* Right: Clock & Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end mr-2">
          <div className="flex items-center gap-1.5 text-primary/70">
            <Clock size={12} />
            <span className="font-mono text-sm tracking-wider tabular-nums">{formattedTime}</span>
          </div>
          <span className="text-[9px] font-mono text-muted/50 uppercase tracking-wider">{formattedDate}</span>
        </div>

        <div className="w-px h-8 bg-primary/10 hidden md:block" />

        <button 
          onClick={clearHistory}
          className="p-2.5 text-muted/50 hover:text-accent hover:bg-accent/10 rounded-xl transition-all duration-300 cursor-pointer"
          title="Limpar Conversa"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
