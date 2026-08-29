import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Container, Button, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Snackbar, Alert, CircularProgress
} from '@mui/material';
import {
  AccountTree, SyncAlt, Psychology, PlaylistAddCheck, TrackChanges,
  VerifiedUser, ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useBackendWarmup } from '../../hooks/useBackendWarmup';
import { API_BASE_URL } from '../../config';
import { SEO } from '../../components/SEO/SEO';
import { RiskCalculatorWidget } from './RiskCalculatorWidget';
import { HeroVideo } from './HeroVideo';

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

const STEPS = [
  { title: 'Planning (5Ts)', desc: 'Scope, team, timing, tools, tasks' },
  { title: 'Structure Analysis', desc: 'Hierarchies from BOM/PFD' },
  { title: 'Function Analysis', desc: 'Functions, requirements, specs' },
  { title: 'Failure Analysis', desc: 'Cause → mode → effect chains' },
  { title: 'Risk Analysis', desc: 'S / O / D ratings 1-10' },
  { title: 'Optimization', desc: 'Actions on High AP items' },
  { title: 'Documentation', desc: 'Locked, signed revisions' },
];

const FEATURES = [
  { icon: <AccountTree />, title: '7-Step Workflow', desc: 'AIAG-VDA gating, zero skips' },
  { icon: <SyncAlt />, title: 'PFD ↔ PFMEA', desc: 'Bidirectional sync, orphan flags' },
  { icon: <Psychology />, title: 'AI Copilot', desc: 'RAG suggestions, HITL review' },
  { icon: <PlaylistAddCheck />, title: 'Control Plan', desc: 'Serializable propagation' },
  { icon: <TrackChanges />, title: 'Actions', desc: 'Lifecycle + R2 evidence' },
  { icon: <VerifiedUser />, title: '21 CFR 11', desc: 'Signatures, immutable audit' },
];

const SPECS = [
  ['Standards', 'AIAG-VDA 2019 · 21 CFR Part 11'],
  ['Docs', 'PFMEA · DFMEA · PFD · Control Plan'],
  ['AI Engine', 'LLM + RAG, HNSW tenant-isolated'],
  ['Database', 'Postgres 15 + pgvector, RLS'],
  ['Security', 'JWT 15m/7d · RBAC · HMAC webhooks'],
  ['Deploy', 'Render · Cloudflare · serverless'],
  ['Files', 'R2 / MinIO, 50 MB presigned'],
];

const INQUIRY_TYPES = ['Demo Request', 'Purchase Inquiry', 'Feature Request', 'General Support'];

const MARQUEE_ITEMS = ['AIAG-VDA 2019', 'PFD ↔ PFMEA', 'Control Plan', '21 CFR Part 11', 'RAG Copilot', 'Auto ERP / MES', 'Zero-Login Preview', 'Action Lifecycle'];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, guestLogin } = useAuth();
  useBackendWarmup();

  const [guestLoading, setGuestLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', type: 'Demo Request', message: '' });
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
      setContactForm({ name: '', email: '', company: '', type: 'Demo Request', message: '' });
    } catch {
      setContactError('Could not send your message. Please try again later.');
    } finally {
      setContactSubmitting(false);
    }
  }, [contactForm]);

  const handlePrimaryCTA = async () => {
    if (token) { navigate('/app/projects'); return; }
    setGuestLoading(true);
    try { await guestLogin(); navigate('/app/initializing'); } catch (err) { console.error('Failed to create guest user:', err); } finally { setGuestLoading(false); }
  };

  const featuresObs = useInView();
  const specsObs = useInView();
  const contactObs = useInView();
  const stepsObs = useInView();

  useEffect(() => {
    const id = 'fmea-landing-kf';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `@keyframes pulseDot{0%,100%{opacity:0.4}50%{opacity:1}}`;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <Box sx={{ overflowX: 'hidden', bgcolor: '#000000', color: '#fff' }}>
      <SEO
        title="FMEApex — Quality Engineered To Evolve | AIAG-VDA AI FMEA"
        description="Modular AI platform for quality engineering. 7-step AIAG-VDA FMEA, PFD↔PFMEA linking, Control Plan sync, Actions lifecycle, 21 CFR Part 11. Try the shared preview — no login."
        canonical="/"
      />

      {/* 1. HERO — full-bleed video, single viewport (HeroVideo owns its own nav) */}
      <Box component="section" sx={{ position: 'relative' }}>
        <HeroVideo />
      </Box>

      {/* 2. TRUST MARQUEE — infinite, muted */}
      <Box component="section" sx={{ bgcolor: '#050505', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', py: 1.6, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', gap: 6, whiteSpace: 'nowrap', animation: 'marquee 26s linear infinite', width: 'max-content' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((m, i) => (
            <Typography key={i} sx={{ color: '#8e8e8e', fontWeight: 500, fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{m} ·</Typography>
          ))}
        </Box>
        <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </Box>

      {/* 3. 7-STEP methodology — compact dark strip */}
      <Box id="process" ref={stepsObs.ref} sx={{ bgcolor: '#000', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 4, gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>The 7-Step Methodology</Typography>
              <Typography sx={{ color: 'text.disabled', fontSize: '0.88rem', mt: 0.5 }}>AIAG-VDA 2019 — gated, auditable, zero skips</Typography>
            </Box>
            <Typography sx={{ color: '#0D9488', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AIAG-VDA</Typography>
          </Box>
          <Grid container spacing={1.2}>
            {STEPS.map((s, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.title} sx={{ display: 'flex' }}>
                <Paper elevation={0} sx={{
                  p: 2, borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.08)',
                  bgcolor: '#0c0c0c', color: 'text.primary', flex: 1,
                  transition: 'all 0.25s ease', opacity: stepsObs.inView ? 1 : 0,
                  transform: stepsObs.inView ? 'none' : 'translateY(14px)', transitionDelay: `${i * 0.08}s`,
                  '&:hover': { borderColor: '#0D9488', transform: 'translateY(-3px)', bgcolor: '#101010' }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography sx={{ color: '#0D9488', fontWeight: 700, fontSize: '0.8rem' }}>0{i + 1}</Typography>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#28282a', animation: i === 2 ? 'pulseDot 1.8s infinite' : 'none' }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', mb: 0.6 }}>{s.title}</Typography>
                  <Typography sx={{ color: '#8e8e8e', fontSize: '0.8rem', lineHeight: 1.55 }}>{s.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 4. FEATURES — bento grid, no cards on hero */}
      <Box id="features" ref={featuresObs.ref} sx={{ bgcolor: '#050505', borderY: '1px solid rgba(255,255,255,0.07)', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.8 }}>Everything You Need</Typography>
          <Typography sx={{ color: '#8e8e8e', fontSize: '0.9rem', maxWidth: 440, mb: 4 }}>Purpose-built dense tooling — keyboard-fast, no AI slop, no learning curve.</Typography>
          <Grid container spacing={1.6}>
            {FEATURES.map((f, i) => (
              <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper elevation={0} sx={{
                  p: 2.6, borderRadius: 2.6, border: '1px solid rgba(255,255,255,0.09)',
                  bgcolor: '#0d0d0d', height: '100%', color: 'text.primary',
                  transition: 'all 0.25s ease',
                  opacity: featuresObs.inView ? 1 : 0, transform: featuresObs.inView ? 'none' : 'translateY(18px)', transitionDelay: `${i * 0.06}s`,
                  '&:hover': { borderColor: '#0D9488', transform: 'translateY(-4px)', bgcolor: '#121212' }
                }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 1.8, bgcolor: 'rgba(13,148,136,0.12)', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.6 }}>{f.icon}</Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.6 }}>{f.title}</Typography>
                  <Typography sx={{ color: '#8e8e8e', fontSize: '0.8rem', lineHeight: 1.55 }}>{f.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 5. RISK MATRIX — stays interactive, dark */}
      <Box sx={{ bgcolor: '#000', py: { xs: 6, md: 8 }, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', mb: 0.6 }}>Visualize Risk Priorities Instantly</Typography>
          <Typography sx={{ textAlign: 'center', color: '#8e8e8e', fontSize: '0.88rem', maxWidth: 440, mx: 'auto', mb: 4 }}>Severity × Occurrence → Action Priority. Live matrix, no learning curve.</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <RiskCalculatorWidget />
          </Box>
        </Container>
      </Box>

      {/* 6. SPECS — two-column detailed, dark */}
      <Box id="specifications" ref={specsObs.ref} sx={{ bgcolor: '#050505', borderY: '1px solid rgba(255,255,255,0.07)', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.6 }}>Technical Specifications</Typography>
          <Typography sx={{ color: '#8e8e8e', fontSize: '0.88rem', maxWidth: 420, mb: 4 }}>Enterprise-grade, production-ready architecture.</Typography>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.6, border: '1px solid rgba(255,255,255,0.09)', bgcolor: '#0c0c0c', opacity: specsObs.inView ? 1 : 0, transform: specsObs.inView ? 'none' : 'translateY(16px)', transition: 'all 0.4s ease' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)', '& th': { color: '#8e8e8e', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', py: 1.2, fontWeight: 600 } }}>
                  <TableCell sx={{ width: '32%' }}>Category</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SPECS.map(([c, d]) => (
                  <TableRow key={c} sx={{ '& td': { borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1.4, fontSize: '0.82rem' } }}>
                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>{c}</TableCell>
                    <TableCell sx={{ color: '#8e8e8e' }}>{d}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </Box>

      {/* 7. CONTACT — dark premium CTA strip with form card */}
      <Box id="contact" ref={contactObs.ref} sx={{ bgcolor: '#000', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}>Get in Touch</Typography>
              <Typography sx={{ color: '#8e8e8e', fontSize: '0.9rem', lineHeight: 1.6, mb: 2 }}>Demo, pricing or enterprise — the team reads every inquiry inside the admin dashboard.</Typography>
              <Button variant="contained" size="large" endIcon={<ArrowForward />} onClick={handlePrimaryCTA} disabled={guestLoading} sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0f766e' }, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 3, py: 1.6 }}>{guestLoading ? <CircularProgress size={22} color="inherit" /> : (token ? 'Go to Dashboard' : 'Launch Preview')}</Button>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper elevation={0} component="form" onSubmit={handleContactSubmit} sx={{
                p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.09)', bgcolor: '#0c0c0c',
                opacity: contactObs.inView ? 1 : 0, transform: contactObs.inView ? 'translateX(0)' : 'translateX(14px)', transition: 'all 0.4s ease 0.1s'
              }}>
                {contactError && <Alert severity="error" sx={{ mb: 2 }}>{contactError}</Alert>}
                <Grid container spacing={1.8}>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Name" size="small" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} sx={{ '& .MuiInputBase-root': { bgcolor: '#050505', color: '#fff' }, '& .MuiInputLabel-root': { color: '#8e8e8e' } }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Email" type="email" size="small" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} sx={{ '& .MuiInputBase-root': { bgcolor: '#050505', color: '#fff' }, '& .MuiInputLabel-root': { color: '#8e8e8e' } }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Company" size="small" value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))} sx={{ '& .MuiInputBase-root': { bgcolor: '#050505', color: '#fff' }, '& .MuiInputLabel-root': { color: '#8e8e8e' } }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth select label="Inquiry Type" size="small" value={contactForm.type} onChange={e => setContactForm(f => ({ ...f, type: e.target.value }))} sx={{ '& .MuiInputBase-root': { bgcolor: '#050505', color: '#fff' }, '& .MuiInputLabel-root': { color: '#8e8e8e' } }}>{INQUIRY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
                  <Grid size={12}><TextField fullWidth required multiline rows={3} label="Message" value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} sx={{ '& .MuiInputBase-root': { bgcolor: '#050505', color: '#fff' }, '& .MuiInputLabel-root': { color: '#8e8e8e' } }} /></Grid>
                  <Grid size={12}>
                    <Button type="submit" variant="contained" fullWidth disabled={contactSubmitting || !contactForm.name || !contactForm.email || !contactForm.message} sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0f766e' }, textTransform: 'none', fontWeight: 600, py: 1.2, borderRadius: 2 }}>{contactSubmitting ? 'Sending...' : 'Send Message'}</Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 8. FOOTER — deep black, minimal */}
      <Box sx={{ bgcolor: '#050505', borderTop: '1px solid rgba(255,255,255,0.06)', py: 3.5 }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(135deg, #0D9488, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FMEApex</Typography>
              <Typography sx={{ color: '#8e8e8e', fontSize: '0.75rem' }}>Quality Engineered To Evolve</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', gap: 2.2, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                {[
                  { label: 'Product', to: '/product' },
                  { label: 'Learn', to: '/learn' },
                  { label: 'Blog', to: '/blog' },
                  { label: 'Pricing', to: '/pricing' },
                  { label: 'About', to: '/about' },
                ].map(l => (
                  <Typography key={l.label} onClick={() => navigate(l.to)} sx={{ cursor: 'pointer', color: '#8e8e8e', fontSize: '0.78rem', fontWeight: 600, '&:hover': { color: '#fff' }, transition: 'color 0.2s' }}>{l.label}</Typography>
                ))}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ color: '#8e8e8e', fontSize: '0.72rem', textAlign: { xs: 'left', md: 'right' } }}>© 2026 FMEApex. All rights reserved.</Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Snackbar open={contactSuccess} autoHideDuration={4000} onClose={() => setContactSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>Thanks — we'll be in touch soon. 🎉</Alert>
      </Snackbar>

      {/* kept fixtures available if needed later */}
      <Box sx={{ display: 'none' }}>{TokenWarmupShim()}</Box>
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      <Box sx={{ display: 'none' }}>{null}</Box>
    </Box>
  );
};

// tiny helper to keep unused refs out of way (kept for future)
function TokenWarmupShim() { return null; }
