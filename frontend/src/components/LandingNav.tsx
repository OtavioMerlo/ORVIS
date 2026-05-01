import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, MessageSquare, Mic } from 'lucide-react';

const LandingNav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Only show on landing page
  if (location.pathname !== '/') return null;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-background/80 backdrop-blur-xl border-b border-primary/10 py-3' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/30 transition-all duration-300 group-hover:shadow-neon">
            <Zap size={18} className="text-primary" />
          </div>
          <span className="font-orbitron text-lg text-primary tracking-widest">ORVIS</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('features')} className="text-xs font-mono text-muted/50 hover:text-primary transition-colors cursor-pointer tracking-wider uppercase">
            Features
          </button>
          <button onClick={() => scrollTo('tech')} className="text-xs font-mono text-muted/50 hover:text-primary transition-colors cursor-pointer tracking-wider uppercase">
            Tech
          </button>
          <div className="w-px h-4 bg-primary/10" />
          <Link to="/voice" className="btn-neon flex items-center gap-2 text-xs px-4 py-2">
            <Mic size={13} />
            Voz
          </Link>
          <Link to="/chat" className="btn-neon flex items-center gap-2 text-xs px-4 py-2">
            <MessageSquare size={13} />
            Chat
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <Link to="/voice" className="p-2.5 text-muted/40 hover:text-primary transition-colors cursor-pointer">
            <Mic size={18} />
          </Link>
          <Link to="/chat" className="btn-neon text-xs px-3 py-2 flex items-center gap-1.5">
            <MessageSquare size={13} />
            Chat
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
