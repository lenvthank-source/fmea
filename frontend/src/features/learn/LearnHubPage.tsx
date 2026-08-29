import React from 'react';
import { Box, Container, Typography, Grid, Paper, Chip } from '@mui/material';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';

const PILLARS = [
  { slug: 'aiag-vda-7-step-fmea', title: 'AIAG-VDA 7-Step FMEA', badge: 'Standards', desc: 'Planning → Structure → Function → Failure → Risk → Optimization → Documentation.' },
  { slug: 'pfd-pfmea-linking', title: 'PFD ↔ PFMEA Linking', badge: 'Linking', desc: 'Bidirectional PFD-PFMEA with orphan warnings and sequence.' },
  { slug: 'control-plan-sync', title: 'Control Plan Sync', badge: 'Control Plan', desc: 'CP propagation from FMEA controls, serializable.' },
  { slug: '21-cfr-part-11-fmea', title: '21 CFR Part 11', badge: 'Compliance', desc: 'Digital signatures, immutable audit_log, segregation.' },
];

export const LearnHubPage: React.FC = () => (
  <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
    <SEO title="Learn — FMEApex Pillar Hub | 7-Step, PFD, Control Plan, 21 CFR" description="Learn hub: 7-step, PFD-PFMEA linking, Control Plan sync, 21 CFR Part 11 — tech articles with TechArticle+FAQ JSON-LD." canonical="/learn" />
    <Box sx={{ bgcolor: '#0F172A', color: '#fff', py: 8, textAlign: 'center' }}>
      <Container maxWidth="md">
        <Typography variant="h3" sx={{ fontWeight: 800 }}>Learn Hub</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 2 }}>Pillar tech articles `features/content/PillarPage.tsx:35 4 slugs` — extractable `ai-definition-block` for Princeton GEO, `TechArticle+FAQPage 252`.</Typography>
      </Container>
    </Box>
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Grid container spacing={3}>
        {PILLARS.map(p => (
          <Grid key={p.slug} size={{ xs: 12, sm: 6 }}>
            <Paper elevation={0} component={Link} to={`/learn/${p.slug}`} style={{ textDecoration: 'none' }} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', display: 'block', '&:hover': { borderColor: '#0D9488' } }}>
              <Chip label={p.badge} size="small" sx={{ bgcolor: 'rgba(13,148,136,0.1)', color: '#0D9488', fontWeight: 600 }} />
              <Typography sx={{ fontWeight: 700, mt: 1 }}>{p.title}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.5 }}>{p.desc}</Typography>
              <Typography sx={{ color: '#0D9488', fontSize: '0.8rem', fontWeight: 600, mt: 1 }}>Read →</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  </Box>
);
export default LearnHubPage;
