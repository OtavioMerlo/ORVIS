import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface NeonZapProps {
  size?: number;
  className?: string;
  glowColor?: string;
}

const NeonZap: React.FC<NeonZapProps> = ({ 
  size = 28, 
  className = "text-primary",
  glowColor = "rgba(0, 243, 255, 0.6)"
}) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Glow layers */}
      <motion.div
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 blur-xl"
        style={{ backgroundColor: glowColor, borderRadius: '50%' }}
      />
      <motion.div
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 blur-md"
        style={{ backgroundColor: glowColor, borderRadius: '50%' }}
      />
      
      {/* Icon with sharp shadow */}
      <motion.div
        animate={{
          filter: [
            `drop-shadow(0 0 2px ${glowColor})`,
            `drop-shadow(0 0 8px ${glowColor})`,
            `drop-shadow(0 0 2px ${glowColor})`
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Zap 
          size={size} 
          className={`${className} relative z-10`} 
          strokeWidth={2.5}
        />
      </motion.div>
    </div>
  );
};

export default NeonZap;
