import axios from 'axios';

const API_URL = import.meta.env.VITE_ORVIS_API_URL || 'http://localhost:8085';
const API_KEY = import.meta.env.VITE_ORVIS_API_KEY || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-ORVIS-API-KEY': API_KEY,
  },
});

export interface ChatRequest {
  message: string;
  session_id: string;
  generate_audio?: boolean;
  voice?: string;
}

export interface ChatResponse {
  content: string;
  session_id: string;
  audio_url?: string;
  audio_base64?: string;
  metadata?: {
    visualizer_color?: string;
    [key: string]: any;
  };
}

export const orvisApi = {
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chat', data);
    return response.data;
  },

  clearChat: async (sessionId: string) => {
    await api.delete(`/chat/${sessionId}`);
  },

  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  speechToText: async (audioBlob: Blob): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append('audio', audioBlob); // Backend expects 'audio' for STT
    const response = await api.post('/api/speech-to-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  sendVoice: async (audioBlob: Blob, sessionId: string = 'voice_immersive'): Promise<ChatResponse> => {
    const formData = new FormData();
    formData.append('file', audioBlob); // Backend expects 'file'
    formData.append('session_id', sessionId);
    formData.append('generate_audio', 'true');
    
    const response = await api.post<ChatResponse>('/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
