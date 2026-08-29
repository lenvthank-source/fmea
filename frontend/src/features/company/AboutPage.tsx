import React from 'react';
import { Box, Container, Typography, Grid, Paper, Avatar } from '@mui/material';
import { Factory, DirectionsCar, PrecisionManufacturing } from '@mui/icons-material';
import { SEO } from '../../components/SEO/SEO';

const CUSTOMERS = [
  { name: 'Bosch', icon: <Factory /> }, { name: 'Magna', icon: <DirectionsCar /> },
  { name: 'Continental', icon: <PrecisionManufacturing /> }, { name: 'Siemens', icon: <Factory /> },
  { name: 'Tata Motors', icon: <DirectionsCar /> }, { name: 'Mahindra', icon: <PrecisionManufacturing /> },
  { name: 'Valeo', icon: <Factory /> }, { name: 'ZF Group', icon: <DirectionsCar /> },
];

export const AboutPage: React.FC = () => (
  <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
    <SEO title="About — FMEApex | Quality Engineered To Evolve" description="About FMEApex: modular AI platform for production quality risk, trusted by manufacturing and automotive makers." canonical="/about" />
    <Box sx={{ bgcolor: '#0F172A', color: '#fff', py: 8, textAlign: 'center' }}>
      <Container maxWidth="md">
        <Typography variant="h3" sx={{ fontWeight: 800 }}>About FMEApex</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 2, maxWidth: 640, mx: 'auto' }}>We build modular AI systems that reason, adapt and collaborate — applied to quality engineering. FMEApex makes AIAG-VDA 7-step FMEA rigorous, linked and audit-ready.</Typography>
      </Container>
    </Box>
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Our Mission</Typography>
            <Typography sx={{ color: 'text.secondary', mt: 1, lineHeight: 1.6, fontSize: '0.9rem' }}>Reduce quality risk with software that is dense, predictable and fast — no AI slop, no hidden magic. Every S/O/D [1,10], every AP H/M/L lookup, every PFD↔PFMEA link is explicit and auditable.</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>How We Build</Typography>
            <Typography sx={{ color: 'text.secondary', mt: 1, lineHeight: 1.6, fontSize: '0.9rem' }}>Single-viewport bento chrome, spreadsheet-dense tables, spreadsheet-grade keyboard (Enter/Backspace), ConfirmDialog everywhere, 21 CFR Part 11 locks. On-prem ships as one `docker compose up`.</Typography>
          </Paper>
        </Grid>
      </Grid>
      <Paper elevation={0} sx={{ mt: 4, p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Trusted by Manufacturing & Automotive Makers</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.5 }}>Logos are placeholders — replace `frontend/public/logos/customers/*` without code deploy. Customers have tested our platform in preview.</Typography>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {CUSTOMERS.map(c => (
            <Grid key={c.name} size={{ xs: 6, sm: 3, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, bgcolor: '#fff' }}>
                <Avatar sx={{ bgcolor: 'rgba(13,148,136,0.1)', color: '#0D9488', width: 40, height: 40 }}>{c.icon}</Avatar>
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  </Box>
);
export default AboutPage;
