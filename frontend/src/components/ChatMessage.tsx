import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/** Simple markdown-like formatting: **bold**, `code`, ```blocks``` */
function formatContent(text: string): React.ReactNode[] {
  if (!text || typeof text !== 'string') return [];
  const parts: React.ReactNode[] = [];
  // Split by code blocks first
  const codeBlockRegex = /```([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  const processInline = (str: string, key: string): React.ReactNode[] => {
    const inlineParts: React.ReactNode[] = [];
    const inlineRegex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
    let iLastIdx = 0;
    let iMatch;

    while ((iMatch = inlineRegex.exec(str)) !== null) {
      if (iMatch.index > iLastIdx) {
        inlineParts.push(str.slice(iLastIdx, iMatch.index));
      }
      if (iMatch[2]) {
        inlineParts.push(<strong key={`${key}-b-${iMatch.index}`} className="text-primary font-semibold">{iMatch[2]}</strong>);
      } else if (iMatch[3]) {
        inlineParts.push(
          <code key={`${key}-c-${iMatch.index}`} className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs font-mono text-primary/90">
            {iMatch[3]}
          </code>
        );
      }
      iLastIdx = iMatch.index + iMatch[0].length;
    }
    if (iLastIdx < str.length) {
      inlineParts.push(str.slice(iLastIdx));
    }
    return inlineParts;
  };

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...processInline(text.slice(lastIndex, match.index), `p-${lastIndex}`));
    }
    parts.push(
      <pre key={`cb-${match.index}`} className="my-2 p-3 bg-background/80 border border-primary/15 rounded-xl text-xs font-mono text-primary/80 overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
        <code>{match[1].trim()}</code>
      </pre>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(...processInline(text.slice(lastIndex), `p-${lastIndex}`));
  }

  return parts;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp }) => {
  const isAi = role === 'assistant';
  const [copied, setCopied] = React.useState(false);
  const formattedContent = useMemo(() => formatContent(content), [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "flex w-full mb-4 group",
        isAi ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "flex max-w-[92%] md:max-w-[85%] lg:max-w-[80%]",
        isAi ? "flex-row" : "flex-row-reverse"
      )}>
        {/* Avatar */}
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500",
          isAi 
            ? "bg-surface border border-primary/20 text-primary" 
            : "bg-secondary/15 border border-secondary/30 text-secondary"
        )}>
          {isAi ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Message bubble */}
        <div className={cn(
          "mx-2.5 relative group/msg",
        )}>
          <div className={cn(
            "px-3.5 py-2.5 rounded-2xl transition-all duration-300 shadow-sm",
            isAi 
              ? "bg-surface/70 backdrop-blur-sm border border-primary/10 rounded-tl-sm" 
              : "bg-secondary/10 backdrop-blur-sm border border-secondary/15 rounded-tr-sm"
          )}>
            <div className="text-[13px] md:text-[14px] leading-relaxed whitespace-pre-wrap text-slate-200/90 break-words font-medium tracking-tight">
              {formattedContent}
            </div>
            
            <div className={cn(
              "flex items-center gap-2 mt-2",
              isAi ? "justify-start" : "justify-end"
            )}>
              <span className="text-[9px] opacity-30 font-mono tracking-wider">
                {timestamp}
              </span>
              
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover/msg:opacity-60 hover:!opacity-100 transition-all duration-200 p-0.5 cursor-pointer"
                title="Copiar"
              >
                {copied ? (
                  <Check size={11} className="text-neon-green" />
                ) : (
                  <Copy size={11} className="text-muted" />
                )}
              </button>
            </div>
          </div>

          {/* Subtle border accent */}
          <div className={cn(
            "absolute top-3 w-0.5 h-5 rounded-full transition-all duration-300 opacity-40 group-hover:opacity-80",
            isAi ? "left-0 bg-primary" : "right-0 bg-secondary"
          )} />
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
