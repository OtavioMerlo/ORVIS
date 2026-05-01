import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Brain, Music, CalendarDays, Mic as MicIcon, MessageSquare, ChevronDown, Zap, Shield, Volume2, Cpu, ArrowRight, Sparkles, Globe, Lock } from 'lucide-react';

/* ═══════════════ Animated Counter ═══════════════ */
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

/* ═══════════════ Feature data ═══════════════ */
const FEATURES = [
  {
    icon: Brain, title: 'Memória Inteligente',
    desc: 'Lembra de tudo sobre você. Preferências, fatos, conversas anteriores — tudo guardado com RAG e ChromaDB.',
    color: 'text-secondary', glow: 'rgba(124, 58, 237, 0.15)',
  },
  {
    icon: Music, title: 'Controle de Música',
    desc: 'Toque qualquer música por voz. "Toca Imagine Dragons" e a música começa na hora, com controle de volume.',
    color: 'text-neon-pink', glow: 'rgba(255, 0, 110, 0.15)',
  },
  {
    icon: CalendarDays, title: 'Agenda & Tarefas',
    desc: 'Gerencia suas tarefas, prazos e compromissos. Adicione, complete e organize tudo por voz ou texto.',
    color: 'text-neon-green', glow: 'rgba(0, 255, 136, 0.15)',
  },
  {
    icon: Volume2, title: 'Voz Personalizada',
    desc: 'Fala com a voz que você escolher. Síntese de voz com XTTS v2 para respostas naturais e realistas.',
    color: 'text-primary', glow: 'rgba(0, 243, 255, 0.15)',
  },
];

const STATS = [
  { value: 70, suffix: 'B', label: 'Parâmetros LLM' },
  { value: 100, suffix: '%', label: 'Local & Privado' },
  { value: 24, suffix: '/7', label: 'Sempre Online' },
  { value: 5, suffix: '+', label: 'Ferramentas' },
];

const TECH_ITEMS = [
  { label: 'LLM', value: 'Llama 3.3 70B', icon: Cpu, color: 'text-primary' },
  { label: 'Infra', value: 'Groq Cloud', icon: Zap, color: 'text-secondary' },
  { label: 'Memória', value: 'ChromaDB + RAG', icon: Brain, color: 'text-neon-green' },
  { label: 'Voz', value: 'XTTS v2', icon: MicIcon, color: 'text-neon-pink' },
  { label: 'Framework', value: 'LangChain', icon: Shield, color: 'text-primary' },
  { label: 'API', value: 'FastAPI', icon: ArrowRight, color: 'text-accent' },
];

/* ═══════════════ Landing Page ═══════════════ */
const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  const stat1 = useCounter(70);
  const stat2 = useCounter(100);
  const stat3 = useCounter(24);
  const stat4 = useCounter(5);
  const counters = [stat1, stat2, stat3, stat4];

  return (
    <div ref={containerRef} className="app-landing min-h-screen bg-transparent text-slate-200 relative">
      {/* Neural Scroll Progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent z-[200] origin-left"
        style={{ scaleX: scrollYProgress }}
      />
      
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative h-[110vh] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background z-[1]" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY }} className="relative z-10 text-center px-6 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-10 backdrop-blur-md"
            >
              <Sparkles size={14} className="text-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary/70 tracking-[0.3em] uppercase">Neural Hub Interface v1.0</span>
            </motion.div>

            <h1 className="text-7xl md:text-9xl lg:text-[11rem] font-orbitron font-black tracking-[0.15em] mb-4 animate-neon-pulse leading-none bg-clip-text text-transparent bg-gradient-to-b from-primary to-primary/30">
              ORVIS
            </h1>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-primary/40" />
              <p className="text-sm md:text-base text-primary/60 font-mono tracking-[0.5em] uppercase">
                Beyond Intelligence
              </p>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-primary/40" />
            </div>

            <p className="text-lg md:text-2xl text-slate-400 font-exo font-light tracking-wide max-w-2xl mx-auto mb-12 leading-relaxed">
              O futuro da assistência pessoal integrada em um ambiente <span className="text-secondary font-medium">neural e imersivo</span>.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/voice" className="btn-glow flex items-center gap-3 group relative overflow-hidden px-10 py-5">
              <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
              <MicIcon size={22} className="group-hover:scale-110 transition-transform" />
              <span className="relative z-10">Neural Voice</span>
            </Link>
            <Link to="/chat" className="btn-neon flex items-center gap-3 px-8 py-5 text-base border-primary/20">
              <MessageSquare size={20} />
              Protocolo de Texto
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 12, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-12 z-10 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-mono text-primary/30 tracking-widest uppercase">Scroll to Explore</span>
          <ChevronDown size={20} className="text-primary/30" />
        </motion.div>
      </section>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <section className="py-16 px-6 relative border-y border-primary/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <div key={stat.label} ref={counters[i].ref} className="text-center">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-3xl md:text-4xl font-orbitron font-bold text-primary"
              >
                {counters[i].count}{stat.suffix}
              </motion.p>
              <p className="text-[10px] font-mono text-muted/40 tracking-widest uppercase mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ FEATURES SECTION ═══════════════ */}
      <section id="features" className="py-28 md:py-36 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <p className="text-[10px] font-mono text-secondary/50 tracking-[0.3em] uppercase mb-4">Capacidades</p>
            <h2 className="text-4xl md:text-5xl font-orbitron tracking-wider leading-tight">
              O que o ORVIS<br />
              <span className="text-secondary">pode fazer</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="group feature-card relative overflow-hidden"
              >
                {/* Glow effect on hover */}
                <div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none"
                  style={{ background: feat.glow }}
                />

                <div className="relative flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl bg-surface-elevated/80 flex items-center justify-center border border-primary/5 flex-shrink-0 ${feat.color} transition-all duration-300 group-hover:scale-105`}>
                    <feat.icon size={24} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-orbitron tracking-[0.15em] uppercase mb-3 ${feat.color}`} style={{ textShadow: 'none' }}>
                      {feat.title}
                    </h3>
                    <p className="text-sm text-muted/50 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ VOICE CTA SECTION ═══════════════ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-secondary/3 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[10px] font-mono text-accent/50 tracking-[0.3em] uppercase mb-4">Experiência Imersiva</p>
            <h2 className="text-4xl md:text-5xl font-orbitron tracking-wider mb-6">
              Converse por <span className="text-accent">Voz</span>
            </h2>
            <p className="text-base text-muted/40 max-w-lg mx-auto mb-12 font-light">
              Fale naturalmente com o ORVIS. A esfera 3D reage à sua voz e à resposta da IA em tempo real.
            </p>

            <Link to="/voice" className="btn-glow inline-flex items-center gap-3 group">
              <MicIcon size={22} className="group-hover:animate-pulse" />
              Iniciar Conversa por Voz
              <ArrowRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {['Reconhecimento de Voz', 'Síntese Neural', 'Resposta em Tempo Real'].map((pill) => (
                <span key={pill} className="text-[9px] font-mono text-muted/25 tracking-wider uppercase px-3 py-1.5 rounded-full border border-primary/5">
                  {pill}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ TECH SECTION ═══════════════ */}
      <section id="tech" className="py-28 md:py-36 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <p className="text-[10px] font-mono text-neon-green/50 tracking-[0.3em] uppercase mb-4">Tecnologia</p>
            <h2 className="text-4xl md:text-5xl font-orbitron tracking-wider">Stack Neural</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
            {TECH_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-6 text-center group hover:border-primary/20 transition-all duration-500 hover:-translate-y-1 cursor-default"
              >
                <div className={`w-10 h-10 rounded-xl bg-surface-elevated/50 flex items-center justify-center mx-auto mb-4 ${item.color} transition-all duration-300 group-hover:scale-110`}>
                  <item.icon size={18} />
                </div>
                <p className="text-[9px] font-mono text-muted/30 uppercase tracking-[0.2em] mb-1.5">{item.label}</p>
                <p className="text-sm font-mono text-slate-200/80">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUST SECTION ═══════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: '100% Local', desc: 'Seus dados ficam no seu computador. Sem nuvem, sem rastreamento.' },
              { icon: Globe, title: 'Open Source', desc: 'Código aberto. Customize, contribua e faça o ORVIS seu.' },
              { icon: Zap, title: 'Tempo Real', desc: 'Respostas instantâneas. Processamento em milissegundos com Groq.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center py-6"
              >
                <item.icon size={20} className="mx-auto text-primary/40 mb-4" />
                <h3 className="text-xs font-orbitron text-primary/70 tracking-[0.15em] uppercase mb-2" style={{ textShadow: 'none' }}>
                  {item.title}
                </h3>
                <p className="text-xs text-muted/35 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="py-28 px-6 text-center relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto">
          <h2 className="text-4xl md:text-5xl font-orbitron tracking-wider mb-6">
            Pronto para<br /><span className="text-secondary">começar</span>?
          </h2>
          <p className="text-sm text-muted/40 mb-12 font-light">
            Chat completo com histórico, memória persistente e todas as ferramentas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/voice" className="btn-glow flex items-center gap-3">
              <MicIcon size={20} />
              Modo Voz
            </Link>
            <Link to="/chat" className="btn-neon flex items-center gap-2 px-6 py-3">
              <MessageSquare size={18} />
              Modo Texto
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/3 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] font-mono text-muted/20 tracking-wider uppercase">
          <div className="flex items-center gap-2">
            <Zap size={10} className="text-primary/30" />
            <span>ORVIS Neural Engine v1.0</span>
          </div>
          <span>Built by Otávio Merlo Carvalho</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
