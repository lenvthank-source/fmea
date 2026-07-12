import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Container, Button, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Snackbar, Alert, Tooltip, IconButton, CircularProgress
} from '@mui/material';
import {
  AccountTree, SyncAlt, Psychology, PlaylistAddCheck, TrackChanges,
  VerifiedUser, KeyboardArrowDown, ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
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
    }, { threshold: 0.1, ...options });
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

// Cleaned specifications without real provider names
const SPECS = [
  ['Standards', 'AIAG-VDA 2019, 21 CFR Part 11'],
  ['Document Types', 'PFMEA, DFMEA, PFD, Control Plan'],
  ['AI Engine', 'Secure AI Engine (LLM + RAG Semantic Search)'],
  ['Database', 'High-Availability Relational Database (Vector Indexed)'],
  ['Security', 'Enterprise SSO, JWT + RBAC, Tenant Isolation, Outbound HMAC Webhooks'],
  ['Deployment', 'Global Content Delivery Network & Dedicated API Clusters'],
  ['File Storage', 'Secure Object Storage (50 MB limit per file)'],
];

const INQUIRY_TYPES = ['Purchase Inquiry', 'Demo Request', 'Feature Request', 'General Support'];

/* ────────────────────────────────────────────────────────────
   CSS keyframe strings
   ──────────────────────────────────────────────────────────── */
const GLOBAL_KEYFRAMES = `
@keyframes bounce { 0%,20%,50%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} 60%{transform:translateY(-4px)} }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes floatSlow { 0%,100%{transform:translate(0, 0)} 50%{transform:translate(20px, -20px)} }
@keyframes floatSlowReverse { 0%,100%{transform:translate(0, 0)} 50%{transform:translate(-15px, 15px)} }
`;

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, guestLogin } = useAuth();
  const { isBackendReady } = useBackendWarmup();

  const [guestLoading, setGuestLoading] = useState(false);

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
      if (i >= headline.length) { clearInterval(iv); setTimeout(() => setTypewriterDone(true), 200); }
    }, 60);
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
          const duration = 1200;
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
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
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

  /* ── primary CTA handler ────────────────────────────────── */
  const handlePrimaryCTA = async () => {
    if (token) {
      navigate('/app/projects');
      return;
    }
    setGuestLoading(true);
    try {
      await guestLogin();
      navigate('/app/initializing');
    } catch (err) {
      console.error('Failed to create guest user:', err);
    } finally {
      setGuestLoading(false);
    }
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

  return (
    <Box sx={{ overflowX: 'hidden', bgcolor: '#ffffff', color: '#1e293b' }}>

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200,
          transition: 'all 0.3s ease',
          bgcolor: scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.85)',
          boxShadow: scrolled ? '0 1px 10px rgba(0,0,0,0.05)' : 'none',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', py: 1.8, gap: 2 }}>
          <Typography
            onClick={() => scrollTo('hero')}
            sx={{
              fontWeight: 800, fontSize: '1.25rem', cursor: 'pointer', flexShrink: 0,
              background: 'linear-gradient(135deg, #0D9488, #2563eb)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >
            FMEApex
          </Typography>

          <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 4 }}>
            {['Features', 'Specifications', 'Contact'].map(t => (
              <Typography
                key={t}
                onClick={() => scrollTo(t.toLowerCase())}
                sx={{
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
                  color: 'text.secondary',
                  '&:hover': { color: '#0D9488' }, transition: 'color 0.2s',
                }}
              >
                {t}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
            <Tooltip title={isBackendReady ? 'Launch workspace' : 'Preparing secure workspace...'} arrow>
              <Box sx={{ position: 'relative' }}>
                <Button
                  variant="contained"
                  onClick={handlePrimaryCTA}
                  disabled={guestLoading}
                  sx={{
                    bgcolor: '#0D9488', color: '#fff', textTransform: 'none', fontWeight: 600,
                    borderRadius: 2, px: 3, fontSize: '0.85rem',
                    '&:hover': { bgcolor: '#0f766e' },
                  }}
                >
                  {guestLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : token ? (
                    'Go to Dashboard'
                  ) : (
                    'Sign into Dashboard'
                  )}
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
          minHeight: '85vh', position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 20%, rgba(13, 148, 136, 0.08) 0%, rgba(37, 99, 235, 0.03) 40%, #ffffff 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          pt: 12, pb: 6,
        }}
      >
        {/* Floating gradient blur blobs */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '15%',
            width: 300,
            height: 300,
            bgcolor: 'rgba(13, 148, 136, 0.1)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'floatSlow 10s ease-in-out infinite'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '15%',
            right: '15%',
            width: 250,
            height: 250,
            bgcolor: 'rgba(37, 99, 235, 0.05)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'floatSlowReverse 12s ease-in-out infinite'
          }}
        />

        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800, color: '#0f172a', letterSpacing: '-1px',
              fontSize: { xs: '2.2rem', sm: '3rem', md: '3.6rem' },
              minHeight: { xs: 70, sm: 90, md: 100 },
              lineHeight: 1.2,
            }}
          >
            {typed}
            <Box component="span" sx={{ display: 'inline-block', width: 3, height: '1em', bgcolor: '#0D9488', ml: 0.5, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary', mt: 3, maxWidth: 640, mx: 'auto',
              fontWeight: 500, fontSize: { xs: '0.95rem', md: '1.1rem' }, lineHeight: 1.6,
              opacity: typewriterDone ? 1 : 0, transform: typewriterDone ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            Streamline FMEA quality processes with AIAG-VDA 7-step workflows, interactive tree systems, and bidirectional PFD synchronization.
          </Typography>

          <Box
            sx={{
              mt: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap',
              opacity: typewriterDone ? 1 : 0, transform: typewriterDone ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s',
            }}
          >
            <Button
              variant="contained" size="large"
              endIcon={!guestLoading && <ArrowForward />}
              onClick={handlePrimaryCTA}
              disabled={guestLoading}
              sx={{
                bgcolor: '#0D9488', px: 4, py: 1.4, fontSize: '0.95rem', fontWeight: 600,
                borderRadius: 2.5, textTransform: 'none', '&:hover': { bgcolor: '#0f766e' }
              }}
            >
              {guestLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : token ? (
                'Go to Dashboard'
              ) : (
                'Sign into Dashboard'
              )}
            </Button>
          </Box>
        </Container>

        {/* Scroll-down chevron */}
        <IconButton
          onClick={() => scrollTo('stats')}
          sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: 'text.secondary', animation: 'bounce 2.5s infinite' }}
        >
          <KeyboardArrowDown sx={{ fontSize: 28 }} />
        </IconButton>
      </Box>

      {/* ── STATS COUNTER BAR ───────────────────────────────── */}
      <Box
        id="stats"
        ref={statsRef}
        sx={{
          bgcolor: '#ffffff', py: { xs: 4, md: 5 },
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
            {STATS.map((s, i) => (
              <Grid size={{ xs: 6, md: 3 }} key={i}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.5rem' }, color: '#0D9488' }}>
                    {counters[i]}{s.suffix}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.82rem', mt: 0.5 }}>
                    {s.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── 7-STEP PROCESS EXPLORER ─────────────────────────── */}
      <Box id="process" sx={{ py: { xs: 6, md: 8 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.5px' }}>
            The AIAG-VDA 7-Step Methodology
          </Typography>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 5, maxWidth: 520, mx: 'auto', fontSize: '0.9rem' }}>
            A structured, compliance-driven approach to quality risk management
          </Typography>

          <Box sx={{ maxWidth: 800, mx: 'auto', position: 'relative', mt: 4 }}>
            {/* Central vertical line for timeline */}
            <Box
              sx={{
                position: 'absolute',
                left: { xs: 16, md: '50%' },
                top: 0,
                bottom: 0,
                width: 2,
                bgcolor: 'rgba(13, 148, 136, 0.15)',
                transform: 'translateX(-50%)',
                zIndex: 0
              }}
            />
            {STEPS.map((step, i) => {
              const isEven = i % 2 === 0;
              return (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'row', md: isEven ? 'row' : 'row-reverse' },
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    mb: 4,
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  {/* Content Card container */}
                  <Box
                    sx={{
                      width: { xs: '100%', md: '45%' },
                      pl: { xs: 6, md: isEven ? 0 : 4 },
                      pr: { xs: 0, md: isEven ? 4 : 0 },
                      textAlign: { xs: 'left', md: isEven ? 'right' : 'left' }
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '1px solid rgba(0,0,0,0.06)',
                        bgcolor: '#ffffff',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#0D9488',
                          boxShadow: '0 4px 20px rgba(13, 148, 136, 0.05)',
                        }
                      }}
                    >
                      <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#0D9488', mb: 0.5, textTransform: 'uppercase' }}>
                        Step {i + 1}
                      </Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary', mb: 1 }}>
                        {step.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.5 }}>
                        {step.desc}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: { xs: 16, md: '50%' },
                      transform: 'translateX(-50%)',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#0D9488',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      border: '4px solid #ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    {i + 1}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* ── FEATURES GRID ───────────────────────────────────── */}
      <Box id="features" ref={featuresObs.ref} sx={{ py: { xs: 6, md: 8 }, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.5px' }}>
            Everything You Need
          </Typography>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 5, maxWidth: 480, mx: 'auto', fontSize: '0.9rem' }}>
            Purpose-built tools for every stage of the FMEA lifecycle
          </Typography>
          <Grid container spacing={3}>
            {FEATURES.map((f, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3, borderRadius: 3, height: '100%',
                    border: '1px solid rgba(0,0,0,0.06)',
                    bgcolor: '#ffffff',
                    transition: 'all 0.2s ease',
                    opacity: featuresObs.inView ? 1 : 0,
                    transform: featuresObs.inView ? 'translateY(0)' : 'translateY(16px)',
                    transitionDelay: `${i * 0.05}s`,
                    '&:hover': { transform: 'translateY(-3px)', borderColor: '#0D9488' },
                  }}
                >
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(13,148,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.8, color: '#0D9488' }}>
                    {f.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.8 }}>{f.title}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', lineHeight: 1.5 }}>{f.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── RISK MATRIX VISUALIZATION ───────────────────────── */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.5px' }}>
            Visualize Risk Priorities Instantly
          </Typography>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 4, maxWidth: 440, mx: 'auto', fontSize: '0.9rem' }}>
            Action Priority matrix derived from Severity × Occurrence ratings
          </Typography>

          <Box ref={matrixObs.ref} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Y-axis label */}
            <Box sx={{ display: 'flex', width: '100%', maxWidth: 420 }}>
              <Typography sx={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', fontWeight: 600, fontSize: '0.72rem', color: 'text.secondary', mr: 1, display: { xs: 'none', sm: 'block' } }}>
                Severity →
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '2px' }}>
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
                            aspectRatio: '1', borderRadius: '2px',
                            bgcolor: matrixObs.inView ? matrixColor(severity, occurrence) : 'rgba(0,0,0,0.03)',
                            transition: `background-color 0.2s ease ${diagIdx * 0.015}s, transform 0.2s ease ${diagIdx * 0.015}s`,
                            transform: matrixObs.inView ? 'scale(1)' : 'scale(0.8)',
                            opacity: matrixObs.inView ? 0.8 : 0.2,
                            '&:hover': { opacity: 1, transform: 'scale(1.1)', zIndex: 1 },
                            cursor: 'crosshair',
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
                {/* X-axis label */}
                <Typography sx={{ textAlign: 'center', fontWeight: 600, fontSize: '0.72rem', color: 'text.secondary', mt: 1 }}>
                  Occurrence →
                </Typography>
              </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 2.5, mt: 2.5, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { color: '#22c55e', label: 'Low (<30)' },
                { color: '#eab308', label: 'Medium (30-59)' },
                { color: '#f97316', label: 'High (60-79)' },
                { color: '#ef4444', label: 'Critical (≥80)' },
              ].map(l => (
                <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: l.color, opacity: 0.8 }} />
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{l.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── SPECIFICATIONS TABLE ─────────────────────────────── */}
      <Box id="specifications" ref={specsObs.ref} sx={{ py: { xs: 6, md: 8 }, bgcolor: '#f8fafc' }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, letterSpacing: '-0.5px' }}>
            Technical Specifications
          </Typography>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 4, maxWidth: 400, mx: 'auto', fontSize: '0.9rem' }}>
            Enterprise-grade architecture built for quality teams
          </Typography>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)',
              opacity: specsObs.inView ? 1 : 0,
              transform: specsObs.inView ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 0.4s ease',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(13,148,136,0.03)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem', py: 1.5, width: '35%' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem', py: 1.5 }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SPECS.map(([cat, det], i) => (
                  <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 1.5 }}>{cat}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', py: 1.5 }}>{det}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </Box>

      {/* ── CONTACT SECTION ──────────────────────────────────── */}
      <Box id="contact" ref={contactObs.ref} sx={{ py: { xs: 6, md: 8 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            {/* Left info */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ opacity: contactObs.inView ? 1 : 0, transform: contactObs.inView ? 'translateX(0)' : 'translateX(-16px)', transition: 'all 0.4s ease' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, letterSpacing: '-0.5px' }}>
                  Get in Touch
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6, fontSize: '0.88rem' }}>
                  Interested in FMEApex for your organization? Reach out for a live demo, pricing details, or feature requests. Fill out the contact form and our team will review your inquiry in the administration dashboard.
                </Typography>
              </Box>
            </Grid>

            {/* Right form */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper
                elevation={0}
                component="form"
                onSubmit={handleContactSubmit}
                sx={{
                  p: 3, borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.06)',
                  opacity: contactObs.inView ? 1 : 0,
                  transform: contactObs.inView ? 'translateX(0)' : 'translateX(16px)',
                  transition: 'all 0.4s ease 0.1s',
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
                    <TextField fullWidth required multiline rows={3} label="Message" value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={12}>
                    <Button
                      type="submit" variant="contained" fullWidth
                      disabled={contactSubmitting || !contactForm.name || !contactForm.email || !contactForm.message}
                      sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0f766e' }, textTransform: 'none', fontWeight: 600, borderRadius: 2, py: 1 }}
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
      <Box sx={{ bgcolor: '#ffffff', py: 4, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg, #0D9488, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.5 }}>
                FMEApex
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                AI-Powered Quality Risk Platform
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                {[
                  { label: 'Features', id: 'features' },
                  { label: 'Specifications', id: 'specifications' },
                  { label: 'Contact', id: 'contact' },
                ].map(l => (
                  <Typography
                    key={l.label}
                    onClick={() => scrollTo(l.id)}
                    sx={{ cursor: 'pointer', color: 'text.secondary', fontSize: '0.8rem', fontWeight: 600, '&:hover': { color: '#0D9488' }, transition: 'color 0.2s' }}
                  >
                    {l.label}
                  </Typography>
                ))}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', textAlign: { xs: 'left', md: 'right' } }}>
                © 2026 FMEApex. All rights reserved.
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
