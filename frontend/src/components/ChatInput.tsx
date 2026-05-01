import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square, Loader2, CornerDownLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onVoiceSend: (audioBlob: Blob) => void;
  isThinking: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onVoiceSend, isThinking }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, [isRecording]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isThinking) {
      onSend(input);
      setInput('');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        onVoiceSend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="p-3 md:p-4 bg-background/70 backdrop-blur-xl border-t border-primary/10 sticky bottom-0 z-10">
      <div className="max-w-4xl mx-auto">
        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-[11px] font-mono text-accent tracking-wider">
              RECORDING {formatTime(recordingTime)}
            </span>
            <div className="flex-1 h-px bg-accent/20" />
          </div>
        )}

        <div className="flex items-end gap-2 md:gap-3">
          {/* Textarea wrapper */}
          <div className="relative flex-1 group">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isRecording ? "Ouvindo..." : "Diga algo para o ORVIS..."}
              className={cn(
                "w-full bg-surface/40 border border-primary/10 rounded-xl px-4 py-3 pr-16",
                "focus:outline-none focus:border-primary/30 focus:bg-surface/60",
                "transition-all duration-300 resize-none min-h-[48px]",
                "placeholder:text-muted/30 font-exo text-sm",
                isThinking && "opacity-40 pointer-events-none"
              )}
              rows={1}
            />
            {/* Character count & hint */}
            <div className="absolute bottom-2 right-3 flex items-center gap-2">
              {input.length > 0 && (
                <span className="text-[9px] font-mono text-muted/30">{input.length}</span>
              )}
              {!input && !isRecording && (
                <span className="text-[9px] font-mono text-muted/20 hidden md:flex items-center gap-1">
                  <CornerDownLeft size={9} /> Enter
                </span>
              )}
            </div>
            {/* Focus line */}
            <div className="absolute bottom-0 left-2 right-2 h-px bg-primary/0 group-focus-within:bg-primary/30 transition-all duration-500" />
          </div>

          {/* Voice button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "p-3 rounded-xl transition-all duration-300 flex-shrink-0 cursor-pointer relative",
              isRecording 
                ? "bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25" 
                : "bg-surface/40 text-muted/50 border border-primary/10 hover:text-primary hover:border-primary/30 hover:bg-primary/5"
            )}
            title={isRecording ? "Parar" : "Voz"}
          >
            {isRecording && (
              <div className="absolute inset-0 rounded-xl border-2 border-accent/40 animate-ping" />
            )}
            {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !isRecording) || isThinking}
            className={cn(
              "p-3 rounded-xl transition-all duration-300 flex-shrink-0 cursor-pointer",
              "bg-primary/10 border border-primary/20 text-primary",
              "hover:bg-primary/20 hover:border-primary/40 hover:shadow-neon",
              "disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-primary/10"
            )}
          >
            {isThinking ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
