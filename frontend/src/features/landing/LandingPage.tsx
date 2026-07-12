import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Container, Button, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Snackbar, Alert, Tooltip, LinearProgress, IconButton,
} from '@mui/material';
import {
  AccountTree, SyncAlt, Psychology, PlaylistAddCheck, TrackChanges,
  VerifiedUser, KeyboardArrowDown, Email as EmailIcon, ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useBackendWarmup } from '../../hooks/useBackendWarmup';
import { API_BASE_URL } from '../../config';

/* ────────────────────────────────────────────────────────────
   Utility hook: useInView (IntersectionObserver)
   ──────────────────────────────────────────────────────────── */
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.unobserve(el); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

/* ────────────────────────────────────────────────────────────
   Data Constants
   ──────────────────────────────────────────────────────────── */
const STEPS = [
  { title: 'Planning (5Ts)', desc: 'Define scope, team, timing, tools, and tasks' },
  { title: 'Structure Analysis', desc: 'Build product or process hierarchies from BOM/PFD' },
  { title: 'Function Analysis', desc: 'Map functions, requirements, and specifications' },
  { title: 'Failure Analysis', desc: 'Identify cause → failure mode → effect chains' },
  { title: 'Risk Analysis', desc: 'Rate Severity, Occurrence, and Detection (1-10)' },
  { title: 'Optimization', desc: 'Assign corrective actions for high-risk items' },
  { title: 'Documentation', desc: 'Lock revisions with full audit trail' },
];

const FEATURES = [
  { icon: <AccountTree />, title: '7-Step FMEA Workflow', desc: 'Complete AIAG-VDA compliance with guided step-by-step analysis and automatic gating.' },
  { icon: <SyncAlt />, title: 'PFD ↔ PFMEA Linking', desc: 'Bidirectional synchronization between Process Flow Diagrams and PFMEA analysis grids.' },
  { icon: <Psychology />, title: 'AI Copilot Suggestions', desc: 'Intelligent failure mode, cause, and control recommendations powered by AI.' },
  { icon: <PlaylistAddCheck />, title: 'Control Plan Sync', desc: 'Automatic propagation of controls between FMEA and Control Plans.' },
  { icon: <TrackChanges />, title: 'Action Lifecycle Tracking', desc: 'Full corrective action workflow with evidence uploads and before/after ratings.' },
  { icon: <VerifiedUser />, title: 'Audit-Ready Revisions', desc: '21 CFR Part 11 compliant digital signatures and immutable audit trails.' },
];

const STATS = [
  { value: 7, suffix: '', label: 'Step AIAG-VDA' },
  { value: 100, suffix: '%', label: 'PFD-PFMEA Sync' },
  { value: 10, suffix: 'x', label: 'Faster with AI' },
  { value: 21, suffix: '', label: 'CFR Part 11 Ready' },
];

const SPECS = [
  ['Standards', 'AIAG-VDA 2019, 21 CFR Part 11'],
  ['Document Types', 'PFMEA, DFMEA, PFD, Control Plan'],
  ['AI Engine', 'OpenAI GPT-4 with RAG similarity search'],
  ['Database', 'PostgreSQL with pgvector on Neon'],
  ['Security', 'JWT + RBAC, Multi-tenant isolation, HMAC-SHA256 webhooks'],
  ['Deployment', 'Cloudflare Pages (Frontend), Render (Backend)'],
  ['File Storage', 'Cloudflare R2 (50 MB limit per file)'],
];

const INQUIRY_TYPES = ['Purchase Inquiry', 'Demo Request', 'Feature Request', 'General Support'];

/* ────────────────────────────────────────────────────────────
   CSS keyframe strings (injected once)
   ──────────────────────────────────────────────────────────── */
const GLOBAL_KEYFRAMES = `
@keyframes floatA { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(30px,-40px) rotate(15deg)} }
@keyframes floatB { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-25px,35px) rotate(-12deg)} }
@keyframes floatC { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,20px) scale(1.15)} }
@keyframes bounce { 0%,20%,50%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-12px)} 60%{transform:translateY(-6px)} }
@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
`;

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isBackendReady } = useBackendWarmup();

  /* ── navbar scroll ──────────────────────────────────────── */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── typewriter ─────────────────────────────────────────── */
  const headline = 'AI-Powered Quality Risk Platform';
  const [typed, setTyped] = useState('');
  const [typewriterDone, setTypewriterDone] = useState(false);
  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTyped(headline.slice(0, i));
      if (i >= headline.length) { clearInterval(iv); setTimeout(() => setTypewriterDone(true), 300); }
    }, 90);
    return () => clearInterval(iv);
  }, []);

  /* ── stats counter ──────────────────────────────────────── */
  const statsRef = useRef<HTMLDivElement>(null);
  const [counters, setCounters] = useState<number[]>(STATS.map(() => 0));
  const countedRef = useRef(false);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !countedRef.current) {
        countedRef.current = true;
        STATS.forEach((s, idx) => {
          const duration = 1600;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCounters(prev => { const next = [...prev]; next[idx] = Math.round(eased * s.value); return next; });
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        });
        obs.unobserve(el);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── step auto-advance ──────────────────────────────────── */
  const [activeStep, setActiveStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const pauseRef = useRef(false);
  useEffect(() => {
    const iv = setInterval(() => {
      if (pauseRef.current) return;
      setStepProgress(prev => {
        if (prev >= 100) {
          setActiveStep(s => (s + 1) % STEPS.length);
          return 0;
        }
        return prev + 4;
      });
    }, 100);
    return () => clearInterval(iv);
  }, []);

  /* ── risk matrix ────────────────────────────────────────── */
  const matrixObs = useInView();

  /* ── contact form ───────────────────────────────────────── */
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', type: 'General Support', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleContactSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) return;
    setContactSubmitting(true);
    setContactError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error('Submission failed');
      setContactSuccess(true);
      setContactForm({ name: '', email: '', company: '', type: 'General Support', message: '' });
    } catch {
      setContactError('Could not send your message. Please try again later.');
    } finally {
      setContactSubmitting(false);
    }
  }, [contactForm]);

  /* ── smooth scroll helper ───────────────────────────────── */
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ── inject global keyframes ────────────────────────────── */
  useEffect(() => {
    const id = 'fmea-landing-kf';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = GLOBAL_KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  /* ── section observers ──────────────────────────────────── */
  const featuresObs = useInView();
  const specsObs = useInView();
  const contactObs = useInView();

  /* ── risk matrix color helper ────────────────────────────── */
  const matrixColor = (s: number, o: number) => {
    const v = s * o;
    if (v >= 80) return '#ef4444';
    if (v >= 60) return '#f97316';
    if (v >= 30) return '#eab308';
    return '#22c55e';
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <Box sx={{ overflowX: 'hidden', bgcolor: '#fff' }}>

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200,
          transition: 'all 0.35s ease',
          bgcolor: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', py: 1.5, gap: 2 }}>
          <Typography
            onClick={() => scrollTo('hero')}
            sx={{
              fontWeight: 800, fontSize: '1.4rem', cursor: 'pointer', flexShrink: 0,
              background: 'linear-gradient(135deg, #0D9488, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >
            FMEAworks
          </Typography>

          <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 3 }}>
            {['Home', 'Features', 'Specifications', 'Contact'].map(t => (
              <Typography
                key={t}
                onClick={() => scrollTo(t.toLowerCase() === 'home' ? 'hero' : t.toLowerCase())}
                sx={{
                  cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem',
                  color: scrolled ? 'text.secondary' : 'rgba(255,255,255,0.85)',
                  '&:hover': { color: '#0D9488' }, transition: 'color 0.2s',
                }}
              >
                {t}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{
                borderColor: scrolled ? '#0D9488' : 'rgba(255,255,255,0.5)',
                color: scrolled ? '#0D9488' : '#fff',
                textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2.5,
                '&:hover': { borderColor: '#0D9488', bgcolor: 'rgba(13,148,136,0.06)' },
              }}
            >
              Login
            </Button>
            <Tooltip title={isBackendReady ? 'Start your free workspace' : 'Warming up servers...'} arrow>
              <Box sx={{ position: 'relative' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login?guest=true')}
                  sx={{
                    bgcolor: '#0D9488', color: '#fff', textTransform: 'none', fontWeight: 600,
                    borderRadius: 2, px: 2.5,
                    '&:hover': { bgcolor: '#0f766e' },
                    ...(!isBackendReady && {
                      background: 'linear-gradient(90deg, #0D9488 0%, #14b8a6 50%, #0D9488 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s linear infinite',
                    }),
                  }}
                >
                  Try Free
                </Button>
              </Box>
            </Tooltip>
          </Box>
        </Container>
      </Box>

      {/* ── HERO ────────────────────────────────────────────── */}
      <Box
        id="hero"
        sx={{
          minHeight: '100vh', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(145deg, #0F172A 0%, #1e293b 45%, #0f3d3e 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Floating shapes */}
        {[
          { w: 320, h: 320, top: '8%', left: '-5%', bg: 'rgba(13,148,136,0.08)', anim: 'floatA 14s ease-in-out infinite', br: '40%' },
          { w: 220, h: 220, bottom: '12%', right: '5%', bg: 'rgba(6,182,212,0.07)', anim: 'floatB 18s ease-in-out infinite', br: '50%' },
          { w: 160, h: 160, top: '60%', left: '15%', bg: 'rgba(13,148,136,0.06)', anim: 'floatC 12s ease-in-out infinite', br: '30%' },
          { w: 100, h: 100, top: '20%', right: '18%', bg: 'rgba(6,182,212,0.05)', anim: 'floatA 16s ease-in-out infinite reverse', br: '50%' },
        ].map((s, i) => (
          <Box key={i} sx={{ position: 'absolute', width: s.w, height: s.h, top: s.top, left: s.left, bottom: (s as any).bottom, right: (s as any).right, background: s.bg, borderRadius: s.br, animation: s.anim, pointerEvents: 'none' }} />
        ))}

        {/* Teal glow */}
        <Box sx={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1, pt: 8 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800, color: '#fff', letterSpacing: '-1px',
              fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' },
              minHeight: { xs: 80, sm: 100, md: 120 },
            }}
          >
            {typed}
            <Box component="span" sx={{ display: 'inline-block', width: 3, height: '1em', bgcolor: '#0D9488', ml: 0.5, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.75)', mt: 3, maxWidth: 640, mx: 'auto',
              fontWeight: 400, fontSize: { xs: '1rem', md: '1.2rem' }, lineHeight: 1.7,
              opacity: typewriterDone ? 1 : 0, transform: typewriterDone ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
            }}
          >
            Streamline your FMEA workflow with AIAG-VDA 7-step compliance, intelligent risk analysis, and real-time collaboration.
          </Typography>

          <Box
            sx={{
              mt: 5, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap',
              opacity: typewriterDone ? 1 : 0, transform: typewriterDone ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s',
            }}
          >
            <Button
              variant="contained" size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/login?guest=true')}
              sx={{ bgcolor: '#0D9488', px: 4, py: 1.5, fontSize: '1rem', fontWeight: 600, borderRadius: 3, textTransform: 'none', '&:hover': { bgcolor: '#0f766e' } }}
            >
              Start Exploring Free
            </Button>
            <Button
              variant="outlined" size="large"
              onClick={() => scrollTo('contact')}
              sx={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', px: 4, py: 1.5, fontSize: '1rem', fontWeight: 600, borderRadius: 3, textTransform: 'none', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.06)' } }}
            >
              Contact Sales
            </Button>
          </Box>
        </Container>

        {/* Bouncing chevron */}
        <IconButton
          onClick={() => scrollTo('stats')}
          sx={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.5)', animation: 'bounce 2s infinite' }}
        >
          <KeyboardArrowDown sx={{ fontSize: 36 }} />
        </IconButton>
      </Box>

      {/* ── STATS COUNTER BAR ───────────────────────────────── */}
      <Box
        id="stats"
        ref={statsRef}
        sx={{
          bgcolor: '#0F172A', py: { xs: 5, md: 6 },
          background: 'linear-gradient(90deg, #0F172A 0%, #1e293b 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
            {STATS.map((s, i) => (
              <Grid size={{ xs: 6, md: 3 }} key={i}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '2.2rem', md: '3rem' }, background: 'linear-gradient(135deg, #0D9488, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {counters[i]}{s.suffix}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 500, fontSize: '0.9rem', mt: 0.5 }}>
                    {s.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── 7-STEP PROCESS EXPLORER ─────────────────────────── */}
      <Box id="process" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.5px' }}>
            The AIAG-VDA 7-Step Methodology
          </Typography>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 6, maxWidth: 560, mx: 'auto' }}>
            A structured, compliance-driven approach to quality risk management
          </Typography>

          {/* Steps horizontal scroll */}
          <Box
            onMouseEnter={() => { pauseRef.current = true; }}
            onMouseLeave={() => { pauseRef.current = false; }}
            sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, scrollbarWidth: 'thin', '&::-webkit-scrollbar': { height: 4 } }}
          >
            {STEPS.map((step, i) => {
              const isActive = i === activeStep;
              return (
                <Box
                  key={i}
                  onClick={() => { setActiveStep(i); setStepProgress(0); pauseRef.current = true; }}
                  sx={{
                    minWidth: { xs: 150, md: 170 }, cursor: 'pointer', borderRadius: 3, p: 2.5,
                    transition: 'all 0.35s ease',
                    bgcolor: isActive ? 'rgba(13,148,136,0.08)' : 'rgba(0,0,0,0.02)',
                    border: isActive ? '2px solid #0D9488' : '2px solid transparent',
                    '&:hover': { bgcolor: 'rgba(13,148,136,0.06)', borderColor: 'rgba(13,148,136,0.3)' },
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#0D9488', mb: 0.5 }}>
                    STEP {i + 1}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary', mb: 1 }}>
                    {step.title}
                  </Typography>
                  <Box sx={{ overflow: 'hidden', maxHeight: isActive ? 60 : 0, transition: 'max-height 0.4s ease', opacity: isActive ? 1 : 0 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5 }}>
                      {step.desc}
                    </Typography>
                  </Box>
                  {isActive && (
                    <LinearProgress
                      variant="determinate"
                      value={stepProgress}
                      sx={{ mt: 1.5, height: 3, borderRadius: 2, bgcolor: 'rgba(13,148,136,0.12)', '& .MuiLinearProgress-bar': { bgcolor: '#0D9488', borderRadius: 2 } }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* ── FEATURES GRID ───────────────────────────────────── */}
      <Box id="features" ref={featuresObs.ref} sx={{ py: { xs: 8, md: 12 }, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.5px' }}>
            Everything You Need
          </Typography>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 6, maxWidth: 520, mx: 'auto' }}>
            Purpose-built tools for every stage of the FMEA lifecycle
          </Typography>
          <Grid container spacing={3}>
            {FEATURES.map((f, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5, borderRadius: 4, height: '100%',
                    border: '1px solid rgba(0,0,0,0.06)',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.4s ease',
                    opacity: featuresObs.inView ? 1 : 0,
                    transform: featuresObs.inView ? 'translateY(0)' : 'translateY(32px)',
                    transitionDelay: `${i * 0.1}s`,
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 40px rgba(0,0,0,0.08)', borderColor: 'rgba(13,148,136,0.2)' },
                  }}
                >
                  <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(13,148,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, color: '#0D9488' }}>
                    {f.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 1 }}>{f.title}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.65 }}>{f.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── RISK MATRIX VISUALIZATION ───────────────────────── */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.5px' }}>
            Visualize Risk Priorities Instantly
          </Typography>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 5, maxWidth: 480, mx: 'auto' }}>
            Action Priority matrix derived from Severity × Occurrence ratings
          </Typography>

          <Box ref={matrixObs.ref} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Y-axis label */}
            <Box sx={{ display: 'flex', width: '100%', maxWidth: 480 }}>
              <Typography sx={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mr: 1, display: { xs: 'none', sm: 'block' } }}>
                Severity →
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '3px' }}>
                  {Array.from({ length: 100 }, (_, idx) => {
                    const row = Math.floor(idx / 10);
                    const col = idx % 10;
                    const severity = 10 - row;
                    const occurrence = col + 1;
                    const diagIdx = row + col;
                    return (
                      <Tooltip key={idx} title={`S=${severity} × O=${occurrence} = ${severity * occurrence}`} arrow placement="top">
                        <Box
                          sx={{
                            aspectRatio: '1', borderRadius: '3px',
                            bgcolor: matrixObs.inView ? matrixColor(severity, occurrence) : 'rgba(0,0,0,0.04)',
                            transition: `background-color 0.3s ease ${diagIdx * 0.03}s, transform 0.3s ease ${diagIdx * 0.03}s`,
                            transform: matrixObs.inView ? 'scale(1)' : 'scale(0.5)',
                            opacity: matrixObs.inView ? 0.85 : 0.2,
                            '&:hover': { opacity: 1, transform: 'scale(1.15)', zIndex: 1 },
                            cursor: 'crosshair',
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
                {/* X-axis label */}
                <Typography sx={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mt: 1 }}>
                  Occurrence →
                </Typography>
              </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { color: '#22c55e', label: 'Low (<30)' },
                { color: '#eab308', label: 'Medium (30-59)' },
                { color: '#f97316', label: 'High (60-79)' },
                { color: '#ef4444', label: 'Critical (≥80)' },
              ].map(l => (
                <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: l.color, opacity: 0.85 }} />
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{l.label}</Typography>
                </Box>
              ))}
            </Box>

            <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3, fontSize: '0.85rem', fontStyle: 'italic' }}>
              Real-time Action Priority visualization across your entire process
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* ── SPECIFICATIONS TABLE ─────────────────────────────── */}
      <Box id="specifications" ref={specsObs.ref} sx={{ py: { xs: 8, md: 12 }, bgcolor: '#f8fafc' }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.5px' }}>
            Technical Specifications
          </Typography>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 5, maxWidth: 440, mx: 'auto' }}>
            Enterprise-grade architecture built for quality teams
          </Typography>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)',
              opacity: specsObs.inView ? 1 : 0,
              transform: specsObs.inView ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.6s ease',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(13,148,136,0.04)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', width: '35%' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SPECS.map(([cat, det], i) => (
                  <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{cat}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{det}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </Box>

      {/* ── CONTACT SECTION ──────────────────────────────────── */}
      <Box id="contact" ref={contactObs.ref} sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            {/* Left info */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ opacity: contactObs.inView ? 1 : 0, transform: contactObs.inView ? 'translateX(0)' : 'translateX(-24px)', transition: 'all 0.6s ease' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.5px' }}>
                  Get in Touch
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.7, fontSize: '0.95rem' }}>
                  Interested in FMEAworks for your organization? Reach out for a live demo, pricing details, or feature requests. Our team typically responds within 24 hours.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(13,148,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D9488' }}>
                    <EmailIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.88rem' }}>Email</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>contact@fmeaworks.app</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Right form */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper
                elevation={0}
                component="form"
                onSubmit={handleContactSubmit}
                sx={{
                  p: { xs: 3, md: 4 }, borderRadius: 4,
                  border: '1px solid rgba(0,0,0,0.06)',
                  opacity: contactObs.inView ? 1 : 0,
                  transform: contactObs.inView ? 'translateX(0)' : 'translateX(24px)',
                  transition: 'all 0.6s ease 0.15s',
                }}
              >
                {contactError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{contactError}</Alert>}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth required label="Name" size="small" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth required label="Email" type="email" size="small" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Company (Optional)" size="small" value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth select label="Inquiry Type" size="small" value={contactForm.type} onChange={e => setContactForm(f => ({ ...f, type: e.target.value }))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                      {INQUIRY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth required multiline rows={4} label="Message" value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={12}>
                    <Button
                      type="submit" variant="contained" size="large" fullWidth
                      disabled={contactSubmitting || !contactForm.name || !contactForm.email || !contactForm.message}
                      sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0f766e' }, textTransform: 'none', fontWeight: 600, borderRadius: 2.5, py: 1.5 }}
                    >
                      {contactSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#0F172A', py: { xs: 5, md: 6 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', background: 'linear-gradient(135deg, #0D9488, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.5 }}>
                FMEAworks
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                AI-Powered Quality Risk Platform
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                {[
                  { label: 'Features', id: 'features' },
                  { label: 'Specifications', id: 'specifications' },
                  { label: 'Contact', id: 'contact' },
                  { label: 'Login', href: '/login' },
                ].map(l => (
                  <Typography
                    key={l.label}
                    onClick={() => l.href ? navigate(l.href) : scrollTo(l.id!)}
                    sx={{ cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', fontWeight: 500, '&:hover': { color: '#0D9488' }, transition: 'color 0.2s' }}
                  >
                    {l.label}
                  </Typography>
                ))}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', textAlign: { xs: 'left', md: 'right' } }}>
                © 2026 FMEAworks. All rights reserved.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── SNACKBAR ────────────────────────────────────────── */}
      <Snackbar open={contactSuccess} autoHideDuration={4000} onClose={() => setContactSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>Thank you! We'll be in touch soon. 🎉</Alert>
      </Snackbar>
    </Box>
  );
};
