import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper, Grid, Chip } from '@mui/material';
import { ArrowForward, Book } from '@mui/icons-material';
import { SEO } from '../../components/SEO/SEO';

interface GlossaryData {
  term: string;
  category: string;
  seoTitle: string;
  seoDesc: string;
  definition: string;
  details: string[];
}

const GLOSSARY: Record<string, GlossaryData> = {
  'action-priority': {
    term: 'Action Priority (AP)',
    category: 'AIAG-VDA 2019 Standard',
    seoTitle: 'What is Action Priority (AP) in FMEA? Definition & Matrix | FMEApex',
    seoDesc: 'Learn what Action Priority (AP) is in AIAG-VDA 2019 FMEA. Understand how AP replaces RPN and categorizes risk into High, Medium, or Low priority.',
    definition: 'Action Priority (AP) is a logic-table driven risk evaluation metric introduced in the AIAG-VDA 2019 FMEA manual that replaces the traditional Risk Priority Number (RPN). AP categorizes risk into High, Medium, or Low urgency based on combinations of Severity, Occurrence, and Detection ratings.',
    details: [
      'High AP: Indicates failure modes with severe consequences or high probability of escaping controls. Corrective action is mandatory.',
      'Medium AP: Indicates moderate risk where process control improvements or design tweaks are recommended.',
      'Low AP: Indicates low risk where existing prevention and detection controls are sufficient.'
    ]
  },
  'process-flow-diagram': {
    term: 'Process Flow Diagram (PFD)',
    category: 'Process Engineering',
    seoTitle: 'What is a Process Flow Diagram (PFD) in PFMEA? Definition | FMEApex',
    seoDesc: 'Discover how Process Flow Diagrams (PFD) define manufacturing operations, process steps, and special characteristics before PFMEA risk analysis.',
    definition: 'A Process Flow Diagram (PFD) is a sequential schematic detailing every operation, material movement, inspection step, and storage point in a manufacturing process.',
    details: [
      'Identifies operation numbers, process step descriptions, and equipment specs.',
      'Establishes the foundation for PFMEA Structure Analysis (Step 2).',
      'Flags special/critical characteristics that flow down into Control Plans.'
    ]
  }
};

export const GlossaryPage: React.FC = () => {
  const { term = 'action-priority' } = useParams<{ term: string }>();
  const navigate = useNavigate();
  const data = GLOSSARY[term] || GLOSSARY['action-priority'];

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 10 }}>
      <SEO
        title={data.seoTitle}
        description={data.seoDesc}
        canonical={`/en/glossary/${term}`}
      />

      {/* Hero Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', py: 8 }}>
        <Container maxWidth="lg">
          <Chip icon={<Book sx={{ color: '#2DD4BF !important' }} />} label={data.category} sx={{ bgcolor: 'rgba(45,212,191,0.15)', color: '#2DD4BF', fontWeight: 700, mb: 2 }} />
          <Typography variant="h1" sx={{ fontSize: { xs: '2.2rem', md: '3rem' }, fontWeight: 800, mb: 2 }}>
            What is {data.term}?
          </Typography>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Extractable Princeton GEO Box */}
            <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, borderLeft: '4px solid #0D9488', bgcolor: '#F0FDF4' }} className="ai-definition-block">
              <Typography variant="subtitle2" sx={{ color: '#0D9488', fontWeight: 700, mb: 1, textTransform: 'uppercase' }}>
                Definition
              </Typography>
              <Typography variant="body1" sx={{ color: '#0F172A', fontSize: '1.1rem', lineHeight: 1.8, fontWeight: 500 }}>
                {data.definition}
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
              <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Key Takeaways & Industry Application
              </Typography>
              {data.details.map((item, idx) => (
                <Typography key={idx} variant="body1" sx={{ color: '#334155', lineHeight: 1.8, mb: 2 }}>
                  • {item}
                </Typography>
              ))}
            </Paper>
          </Grid>

          {/* CTA Box */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, background: 'linear-gradient(135deg, #0F172A 0%, #0D9488 100%)', color: '#fff' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Automate {data.term} in FMEApex
              </Typography>
              <Typography variant="body2" sx={{ color: '#E2E8F0', mb: 3, lineHeight: 1.6 }}>
                Experience AIAG-VDA 2019 compliance with automated AP scoring and bidirectional PFD sync.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/login')}
                endIcon={<ArrowForward />}
                sx={{ bgcolor: '#fff', color: '#0F172A', fontWeight: 700, '&:hover': { bgcolor: '#F1F5F9' } }}
              >
                Try Guest Workspace
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
