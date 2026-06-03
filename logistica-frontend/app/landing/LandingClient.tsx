'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import {
  Truck,
  MapPin,
  BarChart3,
  Route,
  Smartphone,
  Zap,
  Shield,
  ArrowRight,
  Check,
  Star,
  Menu,
  X,
  Send,
  Link2,
  Globe,
  Mail,
  TrendingUp,
  Cpu,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Características', href: '#features' },
  { label: 'Cómo funciona', href: '#how-it-works' },
  { label: 'Clientes', href: '#testimonials' },
  { label: 'Precios', href: '#cta' },
];

const LOGOS = [
  'Grupo Bimbo', 'FEMSA', 'Cemex', 'América Móvil',
  'Walmart MX', 'Liverpool', 'Coppel', 'Soriana',
  'Alsea', 'Lala', 'Sigma', 'Gruma',
];

const FEATURES = [
  {
    icon: MapPin,
    title: 'Tracking en tiempo real',
    description: 'Monitorea tu flota y envíos en un mapa interactivo con actualizaciones cada 30 segundos.',
    featured: false,
  },
  {
    icon: BarChart3,
    title: 'Dashboard de operaciones',
    description: 'KPIs, alertas inteligentes y reportes automáticos para decisiones basadas en datos.',
    featured: false,
  },
  {
    icon: Route,
    title: 'Rutas optimizadas con IA',
    description: 'Nuestro algoritmo reduce hasta un 23% el consumo de combustible optimizando cada ruta en tiempo real.',
    featured: true,
  },
  {
    icon: Zap,
    title: 'Integración con ERP y SAP',
    description: 'Conecta con SAP S/4HANA, Oracle y sistemas de facturación electrónica del SAT.',
    featured: false,
  },
  {
    icon: Smartphone,
    title: 'App móvil para conductores',
    description: 'Firma digital, evidencia fotográfica y navegación offline para tus operadores.',
    featured: false,
  },
  {
    icon: Shield,
    title: 'Seguridad y cumplimiento',
    description: 'Cifrado end-to-end, auditoría completa y cumplimiento con regulaciones locales.',
    featured: false,
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Conecta tu flota',
    description: 'Instala nuestro dispositivo GPS o usa la app móvil en los smartphones de tus conductores. Listo en menos de 30 minutos.',
    icon: Truck,
  },
  {
    number: '02',
    title: 'Configura tus rutas',
    description: 'Importa tus puntos de entrega o créalos manualmente. La IA optimiza automáticamente el orden y los tiempos.',
    icon: Route,
  },
  {
    number: '03',
    title: 'Monitorea en tiempo real',
    description: 'Ve el mapa en vivo, recibe alertas de desvíos y comunícate con conductores desde el dashboard central.',
    icon: MapPin,
  },
  {
    number: '04',
    title: 'Analiza y mejora',
    description: 'Reportes automáticos de KPIs, consumo de combustible, tiempos de entrega y satisfacción del cliente.',
    icon: BarChart3,
  },
];

const TESTIMONIALS = [
  {
    name: 'Carlos Mendoza',
    role: 'Director de Operaciones',
    company: 'Distribuidora Norte SA',
    text: 'Redujimos el consumo de combustible un 19% en el primer trimestre. El ROI fue evidente desde el mes 2.',
    rating: 5,
    avatar: 'CM',
  },
  {
    name: 'Ana Gutiérrez',
    role: 'Gerente de Supply Chain',
    company: 'Logística Pacífico',
    text: 'La integración con nuestro SAP fue sorprendentemente fluida. El equipo de soporte es excepcional.',
    rating: 5,
    avatar: 'AG',
  },
  {
    name: 'Roberto Sánchez',
    role: 'VP de Distribución',
    company: 'Grupo Alimentario MX',
    text: 'Pasamos de 3 días de reportes manuales a reportes automáticos instantáneos. Nuestra operación es otra.',
    rating: 5,
    avatar: 'RS',
  },
  {
    name: 'María Fernández',
    role: 'Jefe de Flota',
    company: 'TransFront Solutions',
    text: 'Los conductores adoptaron la app en días. La firma digital eliminó 100% de las disputas de entrega.',
    rating: 5,
    avatar: 'MF',
  },
  {
    name: 'Jorge Ramírez',
    role: 'Director General',
    company: 'Farma Distribución',
    text: 'Cumplimiento regulatorio y trazabilidad completa de la cadena de frío. Indispensable para farmacéuticas.',
    rating: 5,
    avatar: 'JR',
  },
  {
    name: 'Lucia Torres',
    role: 'Gerente de Operaciones',
    company: 'E-Commerce Express',
    text: 'Con 500+ entregas diarias, necesitábamos escalar. Logistica Web maneja el volumen sin problema.',
    rating: 5,
    avatar: 'LT',
  },
];

// animClass drives the CSS float animation defined in globals.css
const FLOATING_BADGES = [
  {
    label: 'Tracking en vivo',
    Icon: MapPin,
    animClass: 'animate-float',
    iconClass: 'text-brand-primary',
    borderClass: 'border-brand-primary/20',
  },
  {
    label: '+23% menos combustible',
    Icon: TrendingUp,
    animClass: 'animate-float-2',
    iconClass: 'text-brand-cta',
    borderClass: 'border-brand-cta/20',
  },
  {
    label: 'IA Optimizado',
    Icon: Cpu,
    animClass: 'animate-float-3',
    iconClass: 'text-brand-secondary',
    borderClass: 'border-brand-secondary/20',
  },
];

// Glow shadow kept as inline style because it derives from dynamic data
const MAP_DOTS = [
  { x: '14%', y: '72%', bg: 'bg-brand-cta', glow: 'rgba(249,115,22,0.65)', pulse: true },
  { x: '44%', y: '42%', bg: 'bg-brand-primary', glow: 'rgba(37,99,235,0.65)', pulse: false },
  { x: '68%', y: '22%', bg: 'bg-brand-primary', glow: 'rgba(37,99,235,0.65)', pulse: false },
  { x: '83%', y: '58%', bg: 'bg-brand-secondary', glow: 'rgba(59,130,246,0.65)', pulse: true },
];

const DASHBOARD_STATS = [
  { label: 'En tránsito', value: '87', colorClass: 'text-brand-secondary' },
  { label: 'Entregados', value: '43', colorClass: 'text-green-500' },
  { label: 'Retrasados', value: '12', colorClass: 'text-brand-cta' },
];

const FOOTER_COLS = [
  {
    title: 'Producto',
    links: ['Características', 'Integraciones', 'Precios', 'Changelog', 'API Docs'],
  },
  {
    title: 'Empresa',
    links: ['Acerca de', 'Blog', 'Careers', 'Press', 'Partners'],
  },
  {
    title: 'Soporte',
    links: ['Documentación', 'Centro de ayuda', 'Status', 'Comunidad', 'Contacto'],
  },
];

const SOCIAL = [
  { Icon: Send, label: 'Twitter' },
  { Icon: Link2, label: 'LinkedIn' },
  { Icon: Globe, label: 'Web' },
  { Icon: Mail, label: 'Email' },
];

// ─── Animation variants ───────────────────────────────────────────────────────

const inView = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ─── Particle Canvas ──────────────────────────────────────────────────────────

function ParticleCanvas() {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const frameRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener(
      'mousemove',
      (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; },
      { passive: true },
    );

    // Fewer particles = cheaper on low-end devices
    const particles: Particle[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.32 + 0.07,
    }));

    const tick = (time: number) => {
      // 30fps cap — halves GPU load vs 60fps
      if (time - lastTickRef.current < 33) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }
      lastTickRef.current = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dxm = mx - p.x;
        const dym = my - p.y;
        const dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 110 && dm > 0) {
          p.vx -= (dxm / dm) * 0.045;
          p.vy -= (dym / dm) * 0.045;
        }
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${p.opacity})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const cx = p.x - q.x;
          const cy = p.y - q.y;
          const cd = Math.sqrt(cx * cx + cy * cy);
          if (cd < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(37,99,235,${0.09 * (1 - cd / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

// ─── Magnetic Button ──────────────────────────────────────────────────────────

function MagneticButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 28 });
  const sy = useSpring(y, { stiffness: 250, damping: 28 });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      style={reduceMotion ? undefined : { x: sx, y: sy, display: 'inline-block' }}
      className={reduceMotion ? 'inline-block' : undefined}
      onMouseMove={(e) => {
        if (reduceMotion) return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - r.left - r.width / 2) * 0.3);
        y.set((e.clientY - r.top - r.height / 2) * 0.3);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      <button className={className} onClick={onClick}>
        {children}
      </button>
    </motion.div>
  );
}

// ─── Tilt Card ────────────────────────────────────────────────────────────────

function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 250, damping: 28 });
  const sry = useSpring(ry, { stiffness: 250, damping: 28 });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      style={
        reduceMotion
          ? undefined
          : { rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }
      }
      onMouseMove={(e) => {
        if (reduceMotion) return;
        const r = e.currentTarget.getBoundingClientRect();
        rx.set(((e.clientY - r.top - r.height / 2) / r.height) * -10);
        ry.set(((e.clientX - r.left - r.width / 2) / r.width) * 10);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${
          scrolled
            ? 'bg-brand-bg/90 backdrop-blur-2xl border-b border-white/[0.06]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-primary">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-lg font-lexend">
              Logistica Web
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors duration-200 cursor-pointer font-sans-landing"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button className="text-sm text-white/60 hover:text-white transition-colors duration-200 cursor-pointer font-sans-landing">
              Iniciar sesión
            </button>
            <MagneticButton className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer bg-brand-cta hover:opacity-90 transition-opacity duration-200 font-sans-landing shadow-[0_4px_16px_rgba(249,115,22,0.3)]">
              Solicitar demo
            </MagneticButton>
          </div>

          <button
            className="md:hidden text-white cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 p-6 bg-brand-bg/95 backdrop-blur-2xl border-b border-white/[0.06]"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block py-3 text-white/70 hover:text-white transition-colors duration-200 cursor-pointer font-sans-landing"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <button className="mt-4 w-full py-3 rounded-xl font-semibold text-white cursor-pointer bg-brand-cta font-sans-landing">
              Solicitar demo gratuita
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HEADLINE = ['Mueve', 'más,', 'gestiona'];

const wordVariants = {
  hidden: { opacity: 0, y: 55 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.11,
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex items-center overflow-hidden min-h-[100dvh] bg-hero-gradient">
      {/* Mesh gradient blobs — CSS animation, compositor thread */}
      <div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none motion-safe:animate-blob-1 will-change-transform"
        style={{
          width: 700,
          height: 700,
          left: '-15%',
          top: '10%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none motion-safe:animate-blob-2 will-change-transform"
        style={{
          width: 500,
          height: 500,
          right: '-5%',
          bottom: '15%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Grid + noise */}
      <div className="absolute inset-0 pointer-events-none bg-grid-subtle" aria-hidden="true" />
      <svg
        className="absolute inset-0 pointer-events-none w-full h-full opacity-[0.025]"
        aria-hidden="true"
      >
        <filter id="noise-h">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-h)" />
      </svg>

      <ParticleCanvas />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 glass text-brand-secondary border-brand-secondary/30"
            >
              <Zap className="w-3 h-3" />
              <span className="font-sans-landing">Nuevo: Integración nativa con SAP S/4HANA</span>
            </motion.div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6 font-lexend">
              {HEADLINE.map((word, i) => (
                <motion.span
                  key={i}
                  custom={reduceMotion ? 0 : i}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  className="inline-block mr-4 text-white"
                >
                  {word}
                </motion.span>
              ))}
              <br />
              <motion.span
                custom={reduceMotion ? 0 : 3}
                variants={wordVariants}
                initial="hidden"
                animate="visible"
                className="inline-block text-brand-cta"
              >
                menos.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.72 }}
              className="text-lg text-white/55 mb-10 max-w-lg leading-relaxed font-sans-landing"
            >
              Logística inteligente para empresas que no se detienen. Tracking en tiempo
              real, rutas con IA y dashboards que hablan tu idioma.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.88 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <MagneticButton className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white cursor-pointer bg-brand-cta hover:opacity-90 transition-opacity duration-200 font-sans-landing shadow-[0_4px_28px_rgba(249,115,22,0.38)]">
                Solicitar demo gratuita
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white cursor-pointer glass border-white/[0.14] hover:bg-white/[0.08] transition-colors duration-200 font-sans-landing">
                Ver demo en vivo
              </MagneticButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.65, delay: 1.05 }}
              className="flex flex-wrap items-center gap-8"
            >
              {[
                { value: '150+', label: 'empresas activas' },
                { value: '1.2M+', label: 'envíos / mes' },
                { value: '99.9%', label: 'uptime SLA' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white font-lexend">{s.value}</p>
                  <p className="text-xs text-white/45 font-sans-landing">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: glass dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.88, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            <div className="rounded-2xl p-6 relative overflow-hidden glass shadow-[0_0_80px_rgba(37,99,235,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]">
              {/* Top glow line */}
              <div
                aria-hidden="true"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.7),transparent)]"
              />

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/40 text-xs font-sans-landing">Dashboard de operaciones</p>
                  <p className="text-white font-semibold text-sm font-lexend">Hoy — 142 envíos activos</p>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
              </div>

              {/* Map */}
              <div className="rounded-xl mb-4 relative overflow-hidden h-[200px] bg-brand-primary/[0.07] border border-brand-primary/[0.14] bg-grid-dense">
                <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
                  <path
                    d="M 40 160 Q 120 80 200 100 Q 280 118 330 55"
                    stroke="rgba(37,99,235,0.5)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M 70 175 Q 160 120 245 140 Q 300 152 355 98"
                    stroke="rgba(249,115,22,0.38)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeDasharray="5 4"
                  />
                </svg>
                {MAP_DOTS.map((dot, i) => (
                  <div key={i} className="absolute" style={{ left: dot.x, top: dot.y }}>
                    <div
                      className={`w-3 h-3 rounded-full ${dot.bg}`}
                      style={{ boxShadow: `0 0 8px ${dot.glow}` }}
                    />
                    {dot.pulse && (
                      <motion.div
                        className={`absolute inset-0 rounded-full ${dot.bg}`}
                        animate={{ scale: [1, 2.8], opacity: [0.35, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {DASHBOARD_STATS.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg p-3 bg-white/[0.03] border border-white/[0.05]"
                  >
                    <p className="text-xs text-white/40 mb-1 font-sans-landing">{s.label}</p>
                    <p className={`text-xl font-bold font-lexend ${s.colorClass}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badges — CSS animation, no FM loop */}
            {FLOATING_BADGES.map(({ label, Icon, animClass, iconClass, borderClass }, i) => (
              <div
                key={i}
                className={`absolute flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white glass border ${borderClass} ${animClass} will-change-transform shadow-[0_4px_24px_rgba(0,0,0,0.35)] font-sans-landing`}
                style={{
                  top: `${16 + i * 28}%`,
                  ...(i % 2 === 0 ? { right: '-10%' } : { left: '-14%' }),
                }}
              >
                <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Logos Bar ────────────────────────────────────────────────────────────────

function LogosBar() {
  return (
    <section className="py-10 overflow-hidden bg-brand-bg/90 border-t border-b border-white/[0.04]">
      <p className="text-center text-[10px] uppercase tracking-[0.2em] text-white/25 mb-6 font-sans-landing">
        Empresas líderes de Latinoamérica confían en nosotros
      </p>
      <div className="relative overflow-hidden">
        {/* CSS marquee — runs on compositor thread */}
        <div
          className="flex gap-16 items-center whitespace-nowrap motion-safe:animate-marquee will-change-transform"
          style={{ width: 'max-content' }}
        >
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <span key={i} className="text-base font-semibold text-white/28 font-lexend">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const featured = FEATURES.find((f) => f.featured)!;
  const regular = FEATURES.filter((f) => !f.featured);

  return (
    <section id="features" className="relative py-28 px-6 bg-brand-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={inView}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-cta font-sans-landing">
            Plataforma completa
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mt-3 mb-4 font-lexend">
            Todo lo que necesita
            <br />
            tu operación
          </h2>
          <p className="text-white/50 max-w-xl mx-auto text-lg font-sans-landing">
            Una plataforma integrada que elimina los silos de información y conecta
            cada parte de tu cadena logística.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Featured card — 2 cols */}
          <motion.div
            variants={inView}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="lg:col-span-2 rounded-2xl p-8 relative overflow-hidden cursor-pointer bg-brand-primary/[0.08] border border-brand-primary/25 shadow-[0_8px_48px_rgba(37,99,235,0.08)]"
          >
            <div
              aria-hidden="true"
              className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(37,99,235,0.1)_0%,transparent_70%)] translate-x-1/3 -translate-y-1/3"
            />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-brand-primary/20 border border-brand-primary/30">
              <featured.icon className="w-6 h-6 text-brand-secondary" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 font-lexend">{featured.title}</h3>
            <p className="text-white/55 text-lg leading-relaxed mb-6 font-sans-landing">
              {featured.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {['CDMX → Monterrey', 'GDL → Puebla', 'MTY → TIJ', 'SLP → VER'].map((route) => (
                <span
                  key={route}
                  className="text-xs px-3 py-1.5 rounded-full bg-brand-primary/15 border border-brand-primary/22 text-blue-300 font-sans-landing"
                >
                  {route}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Regular cards */}
          {regular.map((f, i) => (
            <motion.div
              key={f.title}
              variants={inView}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 cursor-pointer glass"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-brand-cta/10 border border-brand-cta/20">
                <f.icon className="w-5 h-5 text-brand-cta" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 font-lexend">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed font-sans-landing">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6 relative bg-how-gradient">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(37,99,235,0.06)_0%,transparent_70%)]"
      />

      <div className="max-w-5xl mx-auto relative">
        <motion.div
          variants={inView}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-20"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-secondary font-sans-landing">
            Proceso simple
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mt-3 font-lexend">
            En marcha en 30 minutos
          </h2>
        </motion.div>

        <div className="space-y-16">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`flex items-center gap-12 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl font-bold leading-none text-brand-primary/25 font-lexend">
                    {step.number}
                  </span>
                  <h3 className="text-2xl font-bold text-white font-lexend">{step.title}</h3>
                </div>
                <p className="text-white/50 text-lg leading-relaxed font-sans-landing">
                  {step.description}
                </p>
              </div>

              <div className="w-44 h-44 flex-shrink-0 rounded-2xl flex items-center justify-center glass shadow-[0_0_40px_rgba(37,99,235,0.07)]">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-brand-primary/15 border border-brand-primary/20">
                  <step.icon className="w-10 h-10 text-brand-secondary" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section id="testimonials" className="py-28 px-6 bg-brand-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={inView}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-cta font-sans-landing">
            Resultados reales
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mt-3 font-lexend">
            Lo que dicen nuestros clientes
          </h2>
        </motion.div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: i * 0.07 }}
              className="break-inside-avoid mb-6"
            >
              <TiltCard className="rounded-2xl p-6 cursor-pointer glass">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <Star key={si} className="w-4 h-4 fill-current text-brand-cta" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6 font-sans-landing">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 bg-gradient-to-br from-brand-primary to-brand-secondary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white font-lexend">{t.name}</p>
                    <p className="text-xs text-white/40 font-sans-landing">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ────────────────────────────────────────────────────────────────

function CTAFinal() {
  const [email, setEmail] = useState('');

  return (
    <section id="cta" className="py-28 px-6 bg-brand-bg-deep">
      <div className="max-w-2xl mx-auto">
        <motion.div
          variants={inView}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="relative"
        >
          {/* Rotating gradient border — CSS animation */}
          <div
            aria-hidden="true"
            className="absolute -inset-px rounded-3xl overflow-hidden pointer-events-none"
          >
            <div
              className="absolute inset-0 motion-safe:animate-spin-gradient will-change-transform"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0%, rgba(37,99,235,0.6) 25%, rgba(249,115,22,0.6) 50%, rgba(59,130,246,0.6) 75%, transparent 100%)',
              }}
            />
          </div>

          <div className="relative rounded-3xl p-10 text-center overflow-hidden bg-cta-glass">
            <div
              aria-hidden="true"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.8),transparent)]"
            />

            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-brand-cta/13 border border-brand-cta/22">
              <Truck className="w-7 h-7 text-brand-cta" />
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 font-lexend">
              Empieza hoy.
              <br />
              Sin tarjeta de crédito.
            </h2>
            <p className="text-white/50 mb-8 text-lg font-sans-landing">
              Agenda tu demo personalizada y descubre cómo Logistica Web transforma
              tu operación en 30 días.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="flex-1 px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none bg-white/[0.06] border border-white/10 focus:border-brand-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)] transition-all duration-200 font-sans-landing text-[15px]"
              />
              <MagneticButton className="px-6 py-3 rounded-xl font-semibold text-white cursor-pointer bg-brand-cta hover:opacity-90 transition-opacity duration-200 whitespace-nowrap font-sans-landing shadow-[0_4px_20px_rgba(249,115,22,0.32)]">
                Solicitar demo
              </MagneticButton>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {['Sin compromiso', 'Onboarding incluido', 'Soporte 24/7'].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-white/45 font-sans-landing">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-16 px-6 bg-brand-bg-bottom border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-4 gap-12 mb-12">
          <div>
            <a href="#" className="flex items-center gap-2 mb-4 cursor-pointer">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-primary">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white text-lg font-lexend">
                Logistica Web
              </span>
            </a>
            <p className="text-sm text-white/40 leading-relaxed mb-6 max-w-[220px] font-sans-landing">
              Plataforma de gestión logística para empresas que operan en Latinoamérica.
            </p>
            <div className="flex gap-2.5">
              {SOCIAL.map(({ Icon, label }) => (
                <motion.button
                  key={label}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer glass"
                  whileHover={{
                    background: 'rgba(37,99,235,0.2)',
                    border: '1px solid rgba(37,99,235,0.4)',
                    boxShadow: '0 0 18px rgba(37,99,235,0.22)',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="w-4 h-4 text-white/55" />
                </motion.button>
              ))}
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-4 font-lexend">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-white/40 hover:text-white/80 transition-colors duration-200 cursor-pointer font-sans-landing"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.04]">
          <p className="text-xs text-white/28 font-sans-landing">
            © 2026 Logistica Web. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            {['Privacidad', 'Términos', 'Cookies'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs text-white/28 hover:text-white/60 transition-colors duration-200 cursor-pointer font-sans-landing"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function LandingClient() {
  return (
    <main>
      <Nav />
      <Hero />
      <LogosBar />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTAFinal />
      <Footer />
    </main>
  );
}
