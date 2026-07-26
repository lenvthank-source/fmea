import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { Check, Close, ArrowForward } from '@mui/icons-material';
import { SEO } from '../../components/SEO/SEO';

interface CompetitorData {
  competitor: string;
  seoTitle: string;
  seoDesc: string;
  headline: string;
  summary: string;
  matrix: { feature: string; fmeapex: boolean | string; competitor: boolean | string }[];
}

const COMPARISONS: Record<string, CompetitorData> = {
  'excel-fmea': {
    competitor: 'Microsoft Excel',
    seoTitle: 'FMEApex vs Excel: Why Modern FMEA Belongs Off Spreadsheets',
    seoDesc: 'Compare FMEApex vs Microsoft Excel for FMEA management. Eliminate broken links, manual S/O/D scoring, and un-audited revisions.',
    headline: 'FMEApex vs Excel: Why Leading Quality Teams Are Moving Off Spreadsheets',
    summary: 'Excel templates are cheap to start but lead to broken formulas, missing process steps, and audit failures. FMEApex replaces un-managed spreadsheets with an AI-powered relational platform.',
    matrix: [
      { feature: 'AIAG-VDA 7-Step Guided Workflow', fmeapex: true, competitor: false },
      { feature: 'PFD ↔ PFMEA Bidirectional Linking', fmeapex: true, competitor: 'Manual Copy/Paste' },
      { feature: 'Automatic Action Priority (AP) Calculation', fmeapex: true, competitor: 'Complex Nested Formulas' },
      { feature: 'Real-time Control Plan Sync', fmeapex: true, competitor: false },
      { feature: '21 CFR Part 11 Audit Trail & Signatures', fmeapex: true, competitor: false },
      { feature: 'AI Copilot Risk & Cause Suggestions', fmeapex: true, competitor: false }
    ]
  },
  'iq-rm': {
    competitor: 'APIS IQ-RM',
    seoTitle: 'FMEApex vs APIS IQ-RM: Modern Cloud FMEA Platform Comparison',
    seoDesc: 'Compare FMEApex vs APIS IQ-RM. Modern web UI, cloud multi-tenancy, instant AI copilot suggestions vs legacy desktop installation.',
    headline: 'FMEApex vs APIS IQ-RM: Modern Cloud-Native Simplicity vs Legacy Complexity',
    summary: 'APIS IQ-RM is a traditional desktop tool with a steep learning curve. FMEApex offers modern cloud collaboration, web browser access, and AI-assisted risk analysis without cumbersome installation.',
    matrix: [
      { feature: 'Cloud-Native Web Access (No Install)', fmeapex: true, competitor: false },
      { feature: 'Modern Intuitive Interface', fmeapex: true, competitor: 'Complex 90s Desktop UI' },
      { feature: 'AI Copilot Semantic Risk Suggestions', fmeapex: true, competitor: false },
      { feature: 'Multi-Tenant Database Isolation', fmeapex: true, competitor: false },
      { feature: 'Real-Time Team Collaboration', fmeapex: true, competitor: 'File Locking' }
    ]
  }
};

export const CompetitorVsPage: React.FC = () => {
  const { competitor = 'excel-fmea' } = useParams<{ competitor: string }>();
  const navigate = useNavigate();
  const data = COMPARISONS[competitor] || COMPARISONS['excel-fmea'];

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 10 }}>
      <SEO
        title={data.seoTitle}
        description={data.seoDesc}
        canonical={`/en/vs/${competitor}`}
      />

      {/* Hero Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', py: 8 }}>
        <Container maxWidth="lg">
          <Chip label={`FMEApex vs ${data.competitor}`} sx={{ bgcolor: 'rgba(45,212,191,0.15)', color: '#2DD4BF', fontWeight: 700, mb: 2 }} />
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
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
            Switch to FMEApex
          </Button>
        </Container>
      </Box>

      {/* Comparison Matrix Table */}
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
          <Typography variant="h2" sx={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', mb: 3 }}>
            Feature Comparison Matrix
          </Typography>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Capability / Feature</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', color: '#0D9488' }}>FMEApex</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', color: '#64748B' }}>{data.competitor}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.matrix.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>{row.feature}</TableCell>
                    <TableCell>
                      {typeof row.fmeapex === 'boolean' ? (
                        row.fmeapex ? <Check sx={{ color: '#0D9488', fontWeight: 800 }} /> : <Close sx={{ color: '#EF4444' }} />
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0D9488' }}>{row.fmeapex}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {typeof row.competitor === 'boolean' ? (
                        row.competitor ? <Check sx={{ color: '#0D9488' }} /> : <Close sx={{ color: '#EF4444' }} />
                      ) : (
                        <Typography variant="body2" sx={{ color: '#64748B' }}>{row.competitor}</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
};
