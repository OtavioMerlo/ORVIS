import React, { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import AudioVisualizer from '../components/AudioVisualizer';
import StatusBar from '../components/StatusBar';
import ChatSidebar from '../components/ChatSidebar';
import { useChatStore } from '../store/useChatStore';
import { orvisApi } from '../api/orvis';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, CalendarDays, Brain, Clock, Sparkles, ChevronRight, Menu } from 'lucide-react';

/* ═══════════════ Quick Action Chips ═══════════════ */
const QUICK_ACTIONS = [
  { icon: Music, label: 'Tocar Música', prompt: 'toca uma música pra mim' },
  { icon: CalendarDays, label: 'Agenda', prompt: 'como está minha agenda hoje?' },
  { icon: Brain, label: 'Memórias', prompt: 'o que você sabe sobre mim?' },
  { icon: Clock, label: 'Hora Atual', prompt: 'que horas são?' },
];

/* ═══════════════ Reactor Core (empty state) ═══════════════ */
const ReactorCore: React.FC = () => (
  <div className="relative w-36 h-36 flex items-center justify-center">
    <div className="absolute w-36 h-36 rounded-full border border-primary/10 animate-orbit-slow" />
    <div className="absolute w-36 h-36 rounded-full border border-dashed border-secondary/10 animate-orbit-reverse" />
    <div className="absolute w-24 h-24 rounded-full border border-primary/15 animate-orbit" />
    <div className="absolute w-36 h-36 animate-orbit">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/60" style={{ boxShadow: '0 0 8px rgba(0, 243, 255, 0.6)' }} />
    </div>
    <div className="absolute w-14 h-14 rounded-full bg-primary/5" style={{ boxShadow: '0 0 40px rgba(0, 243, 255, 0.15)' }} />
    <div className="w-11 h-11 rounded-full bg-surface border border-primary/20 flex items-center justify-center animate-breathing">
      <Sparkles size={18} className="text-primary/60" />
    </div>
  </div>
);

/* ═══════════════ Chat App Page ═══════════════ */
const ChatApp: React.FC = () => {
  const { messages, sessionId, isThinking, addMessage, setThinking, initSession, setOnline } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      initSession();
      orvisApi.checkHealth()
        .then(() => setOnline(true))
        .catch(() => setOnline(false));
    } catch (err) {
      console.error("Critical initialization error:", err);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const handleSendMessage = async (text: string) => {
    addMessage({ role: 'user', content: text });
    setThinking(true);

    try {
      const response = await orvisApi.sendMessage({
        message: text,
        session_id: sessionId,
        generate_audio: true,
      });

      addMessage({
        role: 'assistant',
        content: response.content,
        audioUrl: response.audio_url,
      });

      if (response.audio_url || response.audio_base64) {
        const audioSrc = response.audio_base64 
          ? `data:audio/wav;base64,${response.audio_base64}` 
          : response.audio_url;
        
        if (audioSrc) {
          setCurrentAudio(audioSrc);
          const audio = new Audio(audioSrc);
          audio.play().catch(err => {
            console.error("Audio playback failed:", err);
            // Optionally notify user that autoplay was blocked
          });
          audio.onended = () => setCurrentAudio(null);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: 'Erro de conexão com o sistema neural. Verifique se o backend está ativo.',
      });
    } finally {
      setThinking(false);
    }
  };

  const handleVoiceSend = async (audioBlob: Blob) => {
    setThinking(true);
    try {
      const { text } = await orvisApi.speechToText(audioBlob);
      if (text) handleSendMessage(text);
    } catch (error) {
      console.error('STT error:', error);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-slate-200 app-chat">
      {/* Sidebar */}
      <ChatSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col scanline relative overflow-hidden min-w-0">
        {/* Top HUD line */}
        <div className="fixed top-0 left-0 w-full h-px z-50">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        {/* Header with sidebar toggle */}
        <div className="flex items-center border-b border-primary/10 bg-background/60 backdrop-blur-xl sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 lg:hidden text-muted/50 hover:text-primary transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <Header />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto scroll-smooth relative z-10 custom-scrollbar" ref={scrollRef}>
          <div className="max-w-5xl mx-auto min-h-full flex flex-col px-3 py-4 md:px-8 md:py-8">

            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center select-none py-12">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                  <ReactorCore />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center mt-8">
                  <h2 className="text-2xl md:text-3xl font-orbitron text-primary/50 animate-neon-pulse tracking-[0.2em]">ORVIS</h2>
                  <p className="font-mono text-[11px] text-muted/40 mt-2 tracking-widest uppercase">Neural Link Initialized</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-wrap justify-center gap-2 mt-10 max-w-md">
                  {QUICK_ACTIONS.map((action, i) => (
                    <motion.button key={action.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.1 }} onClick={() => handleSendMessage(action.prompt)} className="chip">
                      <action.icon size={14} />
                      <span>{action.label}</span>
                      <ChevronRight size={12} className="opacity-30" />
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
              ))}
            </AnimatePresence>

            {/* Thinking */}
            {isThinking && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface border border-primary/20 flex items-center justify-center">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1 h-1 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1 h-1 bg-accent rounded-full animate-bounce" />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted/30 tracking-wider animate-pulse">Processing...</span>
                </div>
              </motion.div>
            )}
          </div>
        </main>

        {/* Audio Visualizer */}
        <div className="w-full max-w-4xl mx-auto px-4 mb-1 relative z-10">
          <AudioVisualizer isActive={isThinking || !!currentAudio} audioUrl={currentAudio} />
        </div>

        <ChatInput onSend={handleSendMessage} onVoiceSend={handleVoiceSend} isThinking={isThinking} />
        <StatusBar />

        {/* Bottom HUD line */}
        <div className="fixed bottom-0 left-0 w-full h-px z-50">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
