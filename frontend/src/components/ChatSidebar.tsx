import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, MessageSquare, Mic, Search, X, ChevronLeft } from 'lucide-react';
import NeonZap from './NeonZap';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/useChatStore';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose }) => {
  const { sessions, activeSessionId, createSession, switchSession, deleteSession } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleNewChat = () => createSession();

  const handleSwitch = (id: string) => {
    switchSession(id);
    onClose();
  };

  const filteredSessions = sessions.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || 
           s.messages.some(m => m.content.toLowerCase().includes(q));
  });

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative top-0 left-0 h-full z-40
        w-80 bg-background/95 backdrop-blur-2xl
        flex flex-col transition-all duration-400
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Decorative top line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        {/* Header */}
        <div className="p-4 space-y-3">
          {/* Brand + close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <NeonZap size={16} />
              <span className="font-orbitron text-xs text-primary/60 tracking-[0.2em]">ORVIS</span>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 text-muted/30 hover:text-primary transition-colors cursor-pointer">
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleNewChat}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                         bg-primary/5 border border-primary/15 text-primary/70
                         hover:bg-primary/10 hover:border-primary/30 hover:text-primary
                         transition-all duration-300 cursor-pointer group"
            >
              <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-[11px] font-mono tracking-wider">Novo Chat</span>
            </button>
            <Link
              to="/voice"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                         bg-accent/5 border border-accent/15 text-accent/70
                         hover:bg-accent/10 hover:border-accent/30 hover:text-accent
                         transition-all duration-300 cursor-pointer group"
            >
              <Mic size={14} />
              <span className="text-[11px] font-mono tracking-wider hidden xl:inline">Voz</span>
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/20" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="w-full bg-surface/30 border border-primary/5 rounded-xl pl-9 pr-8 py-2
                         text-xs font-mono text-slate-300 placeholder:text-muted/20
                         focus:outline-none focus:border-primary/20 focus:bg-surface/50
                         transition-all duration-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted/30 hover:text-primary cursor-pointer">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Divider with label */}
        <div className="flex items-center gap-3 px-4 mb-2">
          <div className="flex-1 h-px bg-primary/5" />
          <span className="text-[8px] font-mono text-muted/20 tracking-[0.3em] uppercase">Sessões</span>
          <div className="flex-1 h-px bg-primary/5" />
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          <AnimatePresence>
            {filteredSessions.map((session, index) => {
              const isActive = session.id === activeSessionId;
              const isHovered = hoveredId === session.id;
              const lastMsg = session.messages[session.messages.length - 1];
              const preview = lastMsg?.content?.slice(0, 50) || 'Conversa vazia';
              const msgCount = session.messages.length;
              const time = new Date(session.createdAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit',
              });

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => handleSwitch(session.id)}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`
                    relative px-3 py-3 rounded-xl cursor-pointer transition-all duration-200
                    ${isActive
                      ? 'bg-primary/8'
                      : 'hover:bg-surface-elevated/30'
                    }
                  `}
                >
                  {/* Active indicator line */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-primary"
                      style={{ boxShadow: '0 0 8px rgba(0, 243, 255, 0.4)' }}
                    />
                  )}

                  <div className="flex items-start gap-2.5 pl-2">
                    {/* Icon with pulse */}
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                      transition-all duration-300
                      ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface/50 text-muted/25'
                      }
                    `}>
                      <MessageSquare size={14} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[11px] font-mono truncate ${isActive ? 'text-primary/90' : 'text-slate-300/80'}`}>
                          {session.name}
                        </span>
                        <span className="text-[9px] font-mono text-muted/20 flex-shrink-0 ml-2">{time}</span>
                      </div>

                      <p className="text-[10px] text-muted/30 truncate leading-relaxed">{preview}</p>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[8px] font-mono text-muted/15">{msgCount} msgs</span>

                        {/* Delete button */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                              }}
                              className="p-1 text-muted/25 hover:text-accent transition-colors cursor-pointer"
                            >
                              <Trash2 size={10} />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredSessions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[10px] font-mono text-muted/20">
                {searchQuery ? 'Nenhum resultado' : 'Nenhuma conversa'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-primary/3">
          <div className="flex items-center justify-between text-[8px] font-mono text-muted/15 tracking-wider uppercase">
            <span>{sessions.length} sessões</span>
            <span>ORVIS v1.0</span>
          </div>
        </div>

        {/* Right edge glow */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-primary/8 to-transparent" />
      </aside>
    </>
  );
};

export default ChatSidebar;
