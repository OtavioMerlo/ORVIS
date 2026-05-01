import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, MessageSquare, Mic, Settings, Brain, Music, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import NeonZap from './NeonZap';

const MENU_ITEMS = [
  { icon: LayoutGrid, label: 'Painel', path: '/', color: 'text-primary', glow: 'shadow-neon' },
  { icon: MessageSquare, label: 'Chat Neural', path: '/chat', color: 'text-secondary', glow: 'shadow-neon-purple' },
  { icon: Mic, label: 'Modo Voz', path: '/voice', color: 'text-accent', glow: 'shadow-neon-rose' },
  { icon: Brain, label: 'Cérebro', path: '#memory', color: 'text-neon-green', glow: 'shadow-neon' },
  { icon: Music, label: 'Música', path: '#music', color: 'text-neon-pink', glow: 'shadow-neon' },
  { icon: Settings, label: 'Config', path: '#settings', color: 'text-muted', glow: '' },
];

const NeuralHub: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-background/60 backdrop-blur-md z-[-1]"
            />

            {/* Radial Items - More like Tabs */}
            <div className="absolute -top-4 -left-4 w-8 h-8 flex items-center justify-center">
              {MENU_ITEMS.map((item, i) => {
                const startAngle = Math.PI; 
                const endAngle = Math.PI * 1.5;
                const angle = startAngle + (i * (endAngle - startAngle) / (MENU_ITEMS.length - 1));
                
                const radius = 160; 
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                    animate={{ opacity: 1, x: x - 40, y: y - 40, scale: 1 }}
                    exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 260, damping: 20 }}
                    className="absolute pointer-events-auto"
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        group relative flex flex-col items-center justify-center w-22 h-22 
                        rounded-2xl glass-card-elevated hover:border-primary/60 transition-all duration-300
                        ${location.pathname === item.path ? 'border-primary shadow-neon-strong scale-110' : 'border-white/5'}
                      `}
                    >
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-50`} />
                      <item.icon className={`w-7 h-7 ${item.color} group-hover:scale-110 transition-transform mb-1`} />
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted group-hover:text-primary transition-colors">
                        {item.label}
                      </span>
                      
                      {/* Active Indicator */}
                      {location.pathname === item.path && (
                        <motion.div 
                          layoutId="active-hub-tab"
                          className="absolute -bottom-1 w-8 h-1 bg-primary rounded-full shadow-neon"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* HUD Background Decorations */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-48 -left-48 w-96 h-96 pointer-events-none z-[-1]"
            >
              <div className="absolute inset-0 rounded-full border-2 border-primary/5 animate-orbit-slow" />
              <div className="absolute inset-8 rounded-full border border-secondary/10 animate-orbit-reverse" />
              <div className="absolute inset-20 rounded-full border border-accent/5 animate-orbit" />
              <div className="absolute inset-0 bg-radial-gradient(circle, var(--color-primary-glow) 0%, transparent 70%) opacity-20" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <motion.button
        onClick={toggleMenu}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative w-18 h-18 rounded-full flex items-center justify-center cursor-pointer z-10
          transition-all duration-500 border-2
          ${isOpen 
            ? 'bg-accent/10 border-accent shadow-neon-rose rotate-90' 
            : 'glass-card-elevated border-primary/40 shadow-neon-strong'
          }
        `}
      >
        <div className={`absolute inset-0 rounded-full bg-primary/5 ${isOpen ? 'animate-none' : 'animate-pulse'}`} />
        {isOpen ? (
          <X className="text-accent" size={32} />
        ) : (
          <div className="relative">
            <NeonZap size={32} />
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default NeuralHub;
