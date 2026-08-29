import React from 'react';
import { Box, Container, Typography, Grid, Paper, Button } from '@mui/material';
import { AccountTree, SyncAlt, Psychology, PlaylistAddCheck, TrackChanges, VerifiedUser } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';

const FEATURES = [
  { icon: <AccountTree />, title: '7-Step AIAG-VDA', desc: 'Guided Structure → Function → Failure → Risk → Optimization → Documentation with gating.', tab: '7-Step Workflow' },
  { icon: <SyncAlt />, title: 'PFD ↔ PFMEA Linking', desc: 'Bidirectional sync, orphan detection, view-aware linking with rAF throttling.', tab: 'PFD-PFMEA' },
  { icon: <Psychology />, title: 'AI Copilot (RAG)', desc: 'HNSW M=16 tenant-isolated embeddings, Human-in-the-loop proposed→accepted.', tab: 'AI Copilot' },
  { icon: <PlaylistAddCheck />, title: 'Control Plan Sync', desc: 'Serializable control propagation between FMEA and Control Plans.', tab: 'Control Plan' },
  { icon: <TrackChanges />, title: 'Actions Lifecycle', desc: 'Open→InProgress→Completed→Verified→Closed with R2 evidence 50MB.', tab: 'Actions' },
  { icon: <VerifiedUser />, title: '21 CFR Part 11', desc: 'Revision locks, typed audit_log, approval segregation.', tab: 'Revisions' },
];

const SPECS = [
  ['Standards', 'AIAG-VDA 2019, 21 CFR Part 11'],
  ['Docs', 'PFMEA, DFMEA, PFD, Control Plan'],
  ['AI', 'Secure LLM + RAG HNSW 1536d'],
  ['DB', 'Neon Postgres 15 + pgvector, RLS tenantId'],
  ['Security', 'JWT 15m/7d + 72h inactivity, RBAC 22 perms, HMAC webhooks'],
  ['Deploy', 'Cloudflare Pages + Render Docker + BullMQ'],
];

export const ProductPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      <SEO title="Product — FMEApex Deep Dive | 7-Step, PFD-PFMEA, Control Plan" description="Explore FMEApex product deep dive: AIAG-VDA 7-step, PFD-PFMEA linking, AI copilot, Control Plan sync, Actions lifecycle, 21 CFR Part 11." canonical="/product" />
      <Box sx={{ bgcolor: '#0F172A', color: '#fff', py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>Product — Built for Quality Teams</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 2, maxWidth: 640, mx: 'auto' }}>FMEApex unifies 7-step FMEA, PFD, Control Plan and Actions in one tenant-isolated workspace. Try the live demo — 10 shared projects, no login required in preview.</Typography>
          <Button variant="contained" sx={{ mt: 3, bgcolor: '#0D9488', '&:hover': { bgcolor: '#0f766e' }, textTransform: 'none', fontWeight: 600 }} onClick={() => navigate('/login')}>Launch Demo</Button>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          {FEATURES.map(f => (
            <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', height: '100%', '&:hover': { borderColor: '#0D9488' } }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(13,148,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, color: '#0D9488' }}>{f.icon}</Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{f.title}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.8, lineHeight: 1.5 }}>{f.desc}</Typography>
                <Typography sx={{ color: '#0D9488', fontSize: '0.78rem', fontWeight: 600, mt: 1 }}>{f.tab} →</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Paper elevation={0} sx={{ mt: 6, p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Specifications</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {SPECS.map(([k, v]) => (
              <Grid key={k} size={{ xs: 12, sm: 6 }}><Typography sx={{ fontSize: '0.85rem' }}><b>{k}:</b> {v}</Typography></Grid>
            ))}
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};
export default ProductPage;
