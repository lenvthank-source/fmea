import React from 'react';
import { Box, Container, Typography, Grid, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';

const TIERS = [
  { name: 'Preview', price: '$0', desc: '10 shared projects, no login, anyone can edit — try at try.fmeapex.online', features: ['Up to 10 projects', 'No login required', 'Shared demo tenant', 'Feedback widget'] , cta: 'Try Preview', to: '/login' },
  { name: 'Team', price: '$49', desc: 'Per month, tenant-isolated, 21 CFR ready', features: ['Unlimited projects', 'RBAC 22 perms', 'PFD↔PFMEA + Control Plan', 'R2 evidence 50MB'], cta: 'Start Team', to: '/login' },
  { name: 'Enterprise', price: 'Custom', desc: 'On-prem Docker, license `exp + maxSeats`, super-admin health/logs', features: ['docker compose up -d', 'License JWT RS256', 'Pino logs + requestId', 'Super-admin Fleet/Health'], cta: 'Contact Sales', to: '/about' },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      <SEO title="Pricing — FMEApex | Preview $0, Team $49, Enterprise Custom" description="FMEApex pricing: Preview $0 (10 projects, no login), Team $49, Enterprise custom on-prem with license." canonical="/pricing" />
      <Box sx={{ bgcolor: '#0F172A', color: '#fff', py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Pricing — Start Free, Scale to On-Prem</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 2 }}>From `frontend/public/pricing.md:1` Guest $0 5 projects → Preview $0 10 projects shared. One command deploy for enterprise.</Typography>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          {TIERS.map(t => (
            <Grid key={t.name} size={{ xs: 12, md: 4 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: t.name==='Team' ? '2px solid #0D9488' : '1px solid rgba(0,0,0,0.06)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{t.name}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0D9488', mt: 1 }}>{t.price}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 1, minHeight: 40 }}>{t.desc}</Typography>
                <Box sx={{ mt: 2, flex: 1 }}>
                  {t.features.map(f => <Typography key={f} sx={{ fontSize: '0.85rem', py: 0.5 }}>• {f}</Typography>)}
                </Box>
                <Button variant={t.name==='Team'?'contained':'outlined'} sx={{ mt: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2, ...(t.name==='Team'?{bgcolor:'#0D9488','&:hover':{bgcolor:'#0f766e'}}:{})}} onClick={()=>navigate(t.to)}>{t.cta}</Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
export default PricingPage;
