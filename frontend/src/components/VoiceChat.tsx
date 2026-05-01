import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { orvisApi } from '../api/orvis';

interface VoiceChatProps {
  audioDataRef: React.MutableRefObject<Uint8Array | null>;
  onListeningChange: (listening: boolean) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ audioDataRef, onListeningChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Toque para falar');

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Feed microphone data to the analyser for the 3D sphere
  const startMicAnalysis = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.4;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const pump = () => {
      analyser.getByteFrequencyData(dataArray);
      audioDataRef.current = dataArray;
      animFrameRef.current = requestAnimationFrame(pump);
    };
    pump();
  }, [audioDataRef]);

  const stopMicAnalysis = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    audioDataRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, [audioDataRef]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
        await processAudio(blob);
      };

      mediaRecorder.current.start();
      startMicAnalysis(stream);
      setIsRecording(true);
      onListeningChange(true);
      setStatusText('Ouvindo...');
      setLastResponse(null);
    } catch (err) {
      console.error('Mic error:', err);
      setStatusText('Permita o acesso ao microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      stopMicAnalysis();
      setIsRecording(false);
      onListeningChange(false);
      setStatusText('Processando...');
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      // Speech to text
      const { text } = await orvisApi.speechToText(blob);
      if (!text) {
        setStatusText('Não entendi. Tente novamente.');
        setIsProcessing(false);
        return;
      }

      setStatusText(`Você: "${text}"`);

      // Send to ORVIS
      const response = await orvisApi.sendMessage({
        message: text,
        session_id: 'voice_landing',
        generate_audio: true,
      });

      setLastResponse(response.response);
      setStatusText('Toque para falar');

      // Play audio response
      if (response.audio_url) {
        const audio = new Audio(response.audio_url);
        audio.play();
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      setStatusText('Erro de conexão. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopMicAnalysis();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [stopMicAnalysis]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mic Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`
          relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center
          transition-all duration-500 cursor-pointer
          ${isRecording
            ? 'bg-accent/20 border-2 border-accent shadow-neon-rose animate-mic-pulse'
            : isProcessing
              ? 'bg-secondary/20 border-2 border-secondary/50 cursor-wait'
              : 'bg-primary/10 border-2 border-primary/40 hover:bg-primary/20 hover:shadow-neon hover:border-primary/60'
          }
        `}
      >
        {isProcessing ? (
          <Loader2 size={32} className="text-secondary animate-spin" />
        ) : isRecording ? (
          <MicOff size={32} className="text-accent" />
        ) : (
          <Mic size={32} className="text-primary" />
        )}

        {/* Pulsing ring when recording */}
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping" />
            <div className="absolute -inset-2 rounded-full border border-accent/10 animate-ping [animation-delay:300ms]" />
          </>
        )}
      </button>

      {/* Status */}
      <p className="text-xs font-mono text-muted/60 tracking-wider uppercase">
        {statusText}
      </p>

      {/* Response bubble */}
      <AnimatePresence>
        {lastResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-md glass-card p-4 text-sm text-slate-200/90 leading-relaxed text-center"
          >
            <div className="flex items-center gap-2 justify-center mb-2">
              <div className="status-dot status-dot--online" />
              <span className="text-[10px] font-mono text-primary/50 uppercase tracking-wider">ORVIS</span>
            </div>
            {lastResponse}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceChat;
