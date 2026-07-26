import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { CheckCircle, ArrowForward } from '@mui/icons-material';
import { SEO } from '../../components/SEO/SEO';

interface IndustryData {
  name: string;
  standard: string;
  seoTitle: string;
  seoDesc: string;
  headline: string;
  summary: string;
  sampleFailures: { step: string; mode: string; cause: string; effect: string; ap: 'High' | 'Medium' | 'Low' }[];
  keyFeatures: string[];
}

const INDUSTRIES: Record<string, IndustryData> = {
  'automotive-iatf-16949': {
    name: 'Automotive',
    standard: 'IATF 16949 & AIAG-VDA 2019',
    seoTitle: 'Automotive FMEA Software (IATF 16949 & AIAG-VDA) | FMEApex',
    seoDesc: 'Automate automotive PFMEA & DFMEA workflows matching IATF 16949 standards. Integrated AP lookup and Control Plan sync for OEMs & Tier-1 suppliers.',
    headline: 'AIAG-VDA Compliant FMEA Software for Automotive OEMs & Tier 1 Suppliers',
    summary: 'Automotive OEMs mandate strict compliance with IATF 16949 and AIAG-VDA 2019 standards. FMEApex automates AP lookup tables, guarantees PFD-PFMEA linking, and streamlines PPAP submission packages.',
    sampleFailures: [
      { step: 'Robotic Arc Welding', mode: 'Incomplete Weld Penetration', cause: 'Voltage fluctuation during cycle', effect: 'Structural frame fatigue failure under load', ap: 'High' },
      { step: 'Torque Assembly', mode: 'Fastener Under-Torqued', cause: 'Calibrated transducer drift', effect: 'Loosening during vehicle operation', ap: 'High' },
      { step: 'E-Coat Dip Tank', mode: 'Insufficient Coating Thickness', cause: 'Current density imbalance', effect: 'Premature corrosion of underbody panel', ap: 'Medium' }
    ],
    keyFeatures: [
      'Automatic AIAG-VDA 2019 Action Priority (AP) lookup',
      'Bidirectional PFD ↔ PFMEA ↔ Control Plan synchronization',
      'PPAP Audit-ready documentation exports',
      'Customer-specific Special Characteristics flow-down'
    ]
  },
  'aerospace-as9100': {
    name: 'Aerospace & Defense',
    standard: 'AS9100 & AS13004',
    seoTitle: 'Aerospace FMEA Software (AS9100 & AS13004) | FMEApex',
    seoDesc: 'Streamline aerospace PFMEA & DFMEA workflows matching AS9100 and AS13004 standards. Full risk mitigation, flight-critical quality control, and audit trails.',
    headline: 'AS9100 & AS13004 Audit-Ready FMEA Software for Aerospace Manufacturers',
    summary: 'Aerospace flight-critical components require zero-defect manufacturing risk analysis. FMEApex enforces strict AS13004 risk matrices, flight safety characteristics tracking, and 21 CFR Part 11 style audit logs.',
    sampleFailures: [
      { step: 'Turbine Blade CNC Milling', mode: 'Dimensional Overtolerance', cause: 'Tool bit thermal expansion', effect: 'Aerodynamic imbalance & engine vibration', ap: 'High' },
      { step: 'Composite Layer Curing', mode: 'Interlaminar Void Formation', cause: 'Autoclave pressure drop', effect: 'Structural delamination during flight', ap: 'High' }
    ],
    keyFeatures: [
      'AS13004 compliant risk matrices',
      'Flight-critical characteristic traceability',
      'Immutable cryptographic revision signatures',
      'Role-based access control for defense suppliers'
    ]
  },
  'medical-iso-13485': {
    name: 'Medical Devices',
    standard: 'ISO 13485 & ISO 14971 / 21 CFR 820',
    seoTitle: 'Medical Device FMEA Software (ISO 13485 & 21 CFR Part 11) | FMEApex',
    seoDesc: 'Accelerate ISO 13485 & ISO 14971 risk management. 21 CFR Part 11 compliant digital signatures, audit-ready DFMEA/PFMEA, and Control Plan sync.',
    headline: 'FDA 21 CFR Part 11 Audit-Ready FMEA Software for Medical Devices',
    summary: 'Medical device manufacturers must comply with ISO 14971 risk management and FDA 21 CFR Part 11. FMEApex locks approved revisions with digital signatures and segregates creator/reviewer/approver duties.',
    sampleFailures: [
      { step: 'Catheter Ultrasonic Sealing', mode: 'Micro-leak in Fluid Channel', cause: 'Horn frequency drift', effect: 'Sterility loss & fluid contamination', ap: 'High' },
      { step: 'Blister Pack Heat Seal', mode: 'Incomplete Seal Perimeter', cause: 'Platen temperature drop', effect: 'Exposed drug product in storage', ap: 'High' }
    ],
    keyFeatures: [
      '21 CFR Part 11 electronic signatures & audit trails',
      'ISO 14971 hazard analysis integration',
      'Immutable revision locking',
      'Cloudflare R2 evidence storage for CAPA verification'
    ]
  },
  'semiconductor-jedec': {
    name: 'Semiconductor',
    standard: 'JEDEC & IATF Semiconductor',
    seoTitle: 'Semiconductor FMEA Software (JEDEC & Wafer Fab Quality) | FMEApex',
    seoDesc: 'Optimize wafer fab and IC packaging FMEA workflows. Automate risk priority calculations for semiconductor manufacturing yield and reliability.',
    headline: 'High-Yield Semiconductor FMEA Software for Fab & Packaging Facilities',
    summary: 'Wafer fabrication and advanced IC packaging demand extreme precision. FMEApex helps semiconductor quality engineers track die-level failure mechanisms and package thermal stress risks.',
    sampleFailures: [
      { step: 'Wire Bonding', mode: 'Non-Wetting Bond Pad', cause: 'Surface oxidation prior to bond', effect: 'Open circuit electrical failure', ap: 'High' },
      { step: 'CMP Wafer Polish', mode: 'Micro-scratching on Die', cause: 'Slurry particle agglomeration', effect: 'Interlayer dielectric breakdown', ap: 'High' }
    ],
    keyFeatures: [
      'Wafer Fab & Assembly packaging templates',
      'Die-level failure mechanism libraries',
      'Automated yield failure chain tracking',
      'Multi-tenant enterprise RLS data security'
    ]
  }
};

export const IndustryFmeaPage: React.FC = () => {
  const { industry = 'automotive-iatf-16949' } = useParams<{ industry: string }>();
  const navigate = useNavigate();
  const data = INDUSTRIES[industry] || INDUSTRIES['automotive-iatf-16949'];

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 10 }}>
      <SEO
        title={data.seoTitle}
        description={data.seoDesc}
        canonical={`/en/fmea/${industry}`}
      />

      {/* Hero Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', py: 8 }}>
        <Container maxWidth="lg">
          <Chip label={data.standard} sx={{ bgcolor: 'rgba(45,212,191,0.15)', color: '#2DD4BF', fontWeight: 700, mb: 2 }} />
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
            {data.headline}
          </Typography>
          <Typography variant="body1" sx={{ color: '#94A3B8', fontSize: '1.1rem', maxWidth: 800, mb: 4, lineHeight: 1.7 }}>
            {data.summary}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            endIcon={<ArrowForward />}
            sx={{ bgcolor: '#0D9488', color: '#fff', fontWeight: 700, px: 4, py: 1.5, '&:hover': { bgcolor: '#0F766E' } }}
          >
            Try {data.name} FMEA Sandbox
          </Button>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* GEO Definition Box */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, borderLeft: '4px solid #0D9488', bgcolor: '#F0FDF4' }}>
              <Typography variant="subtitle2" sx={{ color: '#0D9488', fontWeight: 700, mb: 1, textTransform: 'uppercase' }}>
                Industry Solution Overview
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7 }}>
                FMEApex for {data.name} provides domain-specific failure libraries, automated compliance reporting for {data.standard}, and real-time Control Plan integration to protect product quality and audit readiness.
              </Typography>
            </Paper>

            {/* Sample Failure Chains Table */}
            <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', mb: 2 }}>
              Sample {data.name} Failure Chain Matrix
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ mb: 5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Process Step</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Failure Mode</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Potential Cause</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Failure Effect</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>AP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.sampleFailures.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{row.step}</TableCell>
                      <TableCell>{row.mode}</TableCell>
                      <TableCell>{row.cause}</TableCell>
                      <TableCell>{row.effect}</TableCell>
                      <TableCell>
                        <Chip label={row.ap} size="small" color={row.ap === 'High' ? 'error' : 'warning'} sx={{ fontWeight: 700 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Key Features Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Key {data.name} Capabilities
              </Typography>
              {data.keyFeatures.map((feat, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                  <CheckCircle sx={{ color: '#0D9488', fontSize: '1.2rem', mt: 0.3 }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>{feat}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
