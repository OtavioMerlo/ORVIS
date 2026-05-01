import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import CrystalCore from '../components/CrystalCore';
import { orvisApi } from '../api/orvis';
import { useChatStore } from '../store/useChatStore';

/* ═══════════════ Voice Page — Full Immersive Experience ═══════════════ */
const VoicePage: React.FC = () => {
  const { uiSettings, updateUISettings } = useChatStore();
  const audioDataRef = useRef<Uint8Array | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('Toque para falar');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [showHUD, setShowHUD] = useState(false);

  const hideTimeoutRef = useRef<any>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ttsAnalyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API for real-time feedback
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
            setTranscript(interimTranscript);
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Helper to show HUD for a limited time
  const triggerHUD = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setShowHUD(true);
    hideTimeoutRef.current = setTimeout(() => {
      setShowHUD(false);
    }, 8000);
  }, []);

  // Pump audio data from either mic or TTS to the sphere
  const pumpAudio = useCallback((analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const pump = () => {
      analyser.getByteFrequencyData(dataArray);
      audioDataRef.current = dataArray;
      animFrameRef.current = requestAnimationFrame(pump);
    };
    pump();
  }, []);

  const stopPump = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    audioDataRef.current = null;
  }, []);

  // Play TTS and make sphere react to it
  const playTTSAudio = useCallback(async (url?: string, base64?: string) => {
    setIsSpeaking(true);
    setIsListening(true);
    setStatusText('Falando...');

    try {
      const ctx = new AudioContext();
      let arrayBuffer: ArrayBuffer;

      if (base64) {
        // Convert base64 to ArrayBuffer
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else if (url) {
        const audioResponse = await fetch(url);
        arrayBuffer = await audioResponse.arrayBuffer();
      } else {
        throw new Error("Nenhuma fonte de áudio fornecida");
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;
      ttsAnalyserRef.current = analyser;

      source.connect(analyser);
      analyser.connect(ctx.destination);

      pumpAudio(analyser);

      source.onended = () => {
        stopPump();
        setIsSpeaking(false);
        setIsListening(false);
        setStatusText('Toque para falar');
        ctx.close();
        triggerHUD();
      };

      source.start();
    } catch {
      // Fallback: just play normally
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => {
        setIsSpeaking(false);
        setIsListening(false);
        setStatusText('Toque para falar');
        triggerHUD();
      };
    }
  }, [pumpAudio, stopPump, triggerHUD]);

  const processAudio = useCallback(async (blob: Blob) => {
    setIsProcessing(true);
    setStatusText('Processando...');

    try {
      const res = await orvisApi.sendVoice(blob, 'voice_immersive');
      
      setResponse(res.content);
      setStatusText('Pensando...');

      // Handle color change command if present in response metadata
      if (res.metadata?.visualizer_color) {
        updateUISettings({ visualizerColor: res.metadata.visualizer_color });
      }

      if (res.audio_base64 || res.audio_url) {
        await playTTSAudio(res.audio_url, res.audio_base64);
      } else {
        setStatusText('Toque para falar');
        triggerHUD();
      }
    } catch (error: any) {
      console.error('Voice processing error:', error);
      setStatusText('Erro de processamento');
      setResponse('Não foi possível processar sua voz. Verifique se o servidor está ativo.');
    } finally {
      setIsProcessing(false);
    }
  }, [playTTSAudio, triggerHUD, updateUISettings]);

  // Start mic recording + analysis
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      micAnalyserRef.current = analyser;
      
      // We want the crystal to react to mic too if the user is speaking
      pumpAudio(analyser);

      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
        await processAudio(blob);
      };
      mediaRecorder.current.start();
      recognitionRef.current?.start();

      setIsRecording(true);
      setIsListening(true);
      setStatusText('Ouvindo...');
      setTranscript('');
      setResponse('');
      setShowHUD(false); // Hide HUD when starting new interaction
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    } catch {
      setStatusText('Permita o acesso ao microfone');
    }
  }, [pumpAudio, processAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      recognitionRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      stopPump();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsRecording(false);
      setIsListening(false);
      setStatusText('Processando...');
    }
  }, [stopPump]);

  useEffect(() => {
    return () => {
      stopPump();
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close();
    };
  }, [stopPump]);

  const canInteract = !isRecording && !isProcessing && !isSpeaking;

  // Push-to-talk logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if focus is not in an input/textarea and it's the space bar
      if (
        e.key === ' ' && 
        canInteract && 
        !isRecording &&
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canInteract, isRecording, startRecording, stopRecording]);

  return (
    <div className="fixed inset-0 bg-transparent z-50 flex flex-col font-exo">
      {/* 3D Crystal Core — full background */}
      <div className="absolute inset-0">
        <CrystalCore 
          audioData={audioDataRef} 
          isListening={isListening} 
          color={uiSettings.visualizerColor}
          className="w-full h-full" 
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60 pointer-events-none" />
      
      {/* HUD Frame */}
      <div className="absolute inset-0 border-[20px] border-primary/5 pointer-events-none">
        <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-primary/20" />
        <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-primary/20" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-primary/20" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-primary/20" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-12 py-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-primary/40 tracking-[0.5em] uppercase">Neural Core Active</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            <span className="text-[9px] font-mono text-muted/30 uppercase tracking-widest">Secure Protocol V3.4</span>
          </div>
        </div>
        <div className="text-center group cursor-default">
          <p className="text-sm font-orbitron text-primary tracking-[0.5em] animate-pulse group-hover:text-secondary transition-colors duration-500">ORVIS INTERFACE</p>
          <div className="h-[1px] w-0 group-hover:w-full bg-primary/40 mx-auto transition-all duration-700 mt-1" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono text-secondary/40 tracking-[0.5em] uppercase">Sync Level: 98%</span>
          <span className="text-[9px] font-mono text-muted/30 uppercase tracking-widest">Biometric Auth: OK</span>
        </div>
      </div>

      {/* Main interaction area */}
      <div className="flex-1 flex flex-col items-center justify-end relative z-10 px-8 pb-32">
        {/* Captions HUD Box - New Strategic Location */}
        <AnimatePresence mode="wait">
          {showHUD && (transcript || response) && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden"
            >
              {/* HUD decorative elements */}
              <div className="absolute top-0 left-0 w-12 h-1 bg-primary/40" />
              <div className="absolute bottom-0 right-0 w-12 h-1 bg-secondary/40" />
              
              <div className="flex flex-col gap-6">
                {/* User Input */}
                {transcript && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-3 rounded-full ${isRecording ? 'bg-accent animate-pulse' : 'bg-primary/40'}`} />
                      <span className="text-[10px] font-mono text-primary/40 uppercase tracking-[0.3em]">User Signal</span>
                    </div>
                    <p className="text-sm md:text-base font-mono text-primary/80 leading-relaxed italic pl-4 border-l border-white/5">
                      &quot;{transcript}&quot;
                    </p>
                  </div>
                )}

                {/* ORVIS Response */}
                {response && !isRecording && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-3 rounded-full ${isSpeaking ? 'bg-neon-green animate-pulse' : 'bg-secondary/40'}`} />
                      <span className="text-[10px] font-mono text-secondary/60 uppercase tracking-[0.3em]">Orvis Response</span>
                    </div>
                    <p className="text-base md:text-xl text-slate-100/90 leading-relaxed font-exo font-light tracking-wide pl-4 border-l border-white/5">
                      {response}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 flex flex-col items-center pb-16 gap-6">
        {/* Status indicator */}
        <motion.div
          key={statusText}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/5"
        >
          {isSpeaking && <div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" />}
          {isRecording && <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
          {isProcessing && <Loader2 size={12} className="text-secondary animate-spin" />}
          <span className="text-[10px] font-mono text-white/40 tracking-[0.3em] uppercase">{statusText}</span>
        </motion.div>

        {/* Mic button */}
        <button
          onClick={isRecording ? stopRecording : canInteract ? startRecording : undefined}
          disabled={isProcessing || isSpeaking}
          style={{ '--shadow-color': uiSettings.visualizerColor } as any}
          className={`
            relative w-24 h-24 rounded-full flex items-center justify-center
            transition-all duration-500 cursor-pointer group
            ${isRecording
              ? 'bg-accent/20 border-2 border-accent/60 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              : isProcessing || isSpeaking
                ? 'bg-surface/30 border-2 border-primary/10 cursor-wait'
                : 'bg-primary/5 border-2 border-primary/20 hover:bg-primary/15 hover:border-primary/50'
            }
          `}
        >
          {/* Animated glow ring */}
          <div 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
            style={{ backgroundColor: uiSettings.visualizerColor, filter: 'blur(24px)', opacity: 0.1 }}
          />

          {isProcessing ? (
            <Loader2 size={32} className="text-secondary/60 animate-spin" />
          ) : isSpeaking ? (
            <div className="flex gap-1.5">
              <div className="w-1 h-5 bg-neon-green/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1 h-8 bg-neon-green/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-5 bg-neon-green/60 rounded-full animate-bounce" />
            </div>
          ) : isRecording ? (
            <MicOff size={32} className="text-accent" />
          ) : (
            <Mic size={32} className="text-primary/60 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
          )}

          {isRecording && (
            <div className="absolute -inset-2 rounded-full border-2 border-accent/20 animate-ping" />
          )}
          {isSpeaking && (
            <div className="absolute -inset-2 rounded-full border-2 border-neon-green/10 animate-ping" />
          )}
        </button>
      </div>
    </div>
  );
};

export default VoicePage;
