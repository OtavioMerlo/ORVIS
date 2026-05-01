import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  audioUrl?: string;
}

interface Session {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string;
}

interface UISettings {
  visualizerColor: string;
}

interface ChatState {
  sessions: Session[];
  activeSessionId: string;
  isThinking: boolean;
  isOnline: boolean;
  uiSettings: UISettings;

  // Computed
  messages: Message[];
  sessionId: string;

  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setThinking: (status: boolean) => void;
  setOnline: (status: boolean) => void;
  updateUISettings: (settings: Partial<UISettings>) => void;
  clearHistory: () => void;
  initSession: () => void;
  createSession: () => string;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
}

function createSessionId() {
  return `session_${crypto.randomUUID().slice(0, 8)}`;
}

function createNewSession(): Session {
  const id = createSessionId();
  return {
    id,
    name: `Chat ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
    messages: [],
    createdAt: new Date().toISOString(),
  };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: '',
      isThinking: false,
      isOnline: true,
      uiSettings: {
        visualizerColor: '#00ccff', // Default neon cyan
      },

      messages: [],
      sessionId: '',

      updateUISettings: (settings) => {
        set((state) => ({
          uiSettings: { ...state.uiSettings, ...settings }
        }));
      },

      addMessage: (msg) => {
        const newMessage: Message = {
          ...msg,
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        
        set((state) => {
          const updatedSessions = state.sessions.map(s =>
            s.id === state.activeSessionId
              ? { ...s, messages: [...s.messages, newMessage] }
              : s
          );
          
          const currentSession = updatedSessions.find(s => s.id === state.activeSessionId);
          return { 
            sessions: updatedSessions,
            messages: currentSession?.messages ?? []
          };
        });
      },

      setThinking: (status) => set({ isThinking: status }),
      setOnline: (status) => set({ isOnline: status }),

      clearHistory: () => {
        set((state) => {
          const updatedSessions = state.sessions.map(s =>
            s.id === state.activeSessionId
              ? { ...s, messages: [] }
              : s
          );
          return { 
            sessions: updatedSessions,
            messages: []
          };
        });
      },

      initSession: () => {
        const state = get();
        if (state.sessions.length === 0 || !state.activeSessionId) {
          const session = createNewSession();
          set({ 
            sessions: [session], 
            activeSessionId: session.id,
            sessionId: session.id,
            messages: []
          });
        } else {
          const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
          set({ 
            sessionId: state.activeSessionId,
            messages: currentSession?.messages ?? []
          });
        }
      },

      createSession: () => {
        const session = createNewSession();
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id,
          sessionId: session.id,
          messages: []
        }));
        return session.id;
      },

      switchSession: (id) => {
        const state = get();
        const session = state.sessions.find(s => s.id === id);
        set({ 
          activeSessionId: id,
          sessionId: id,
          messages: session?.messages ?? []
        });
      },

      deleteSession: (id) => {
        set((state) => {
          const remaining = state.sessions.filter(s => s.id !== id);
          if (remaining.length === 0) {
            const newSession = createNewSession();
            return { 
              sessions: [newSession], 
              activeSessionId: newSession.id,
              sessionId: newSession.id,
              messages: []
            };
          }
          const newActiveId = state.activeSessionId === id ? remaining[0].id : state.activeSessionId;
          const newActiveSession = remaining.find(s => s.id === newActiveId);
          return { 
            sessions: remaining, 
            activeSessionId: newActiveId,
            sessionId: newActiveId,
            messages: newActiveSession?.messages ?? []
          };
        });
      },
    }),
    {
      name: 'orvis-chat-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        uiSettings: state.uiSettings,
      }),
    }
  )
);
