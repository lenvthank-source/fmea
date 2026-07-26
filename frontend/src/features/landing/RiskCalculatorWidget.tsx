import React, { useState } from 'react';
import { Box, Paper, Typography, Slider, Grid, Chip, Button } from '@mui/material';
import { Analytics, Psychology, ArrowForward } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const RiskCalculatorWidget: React.FC = () => {
  const navigate = useNavigate();
  const [severity, setSeverity] = useState<number>(9);
  const [occurrence, setOccurrence] = useState<number>(7);
  const [detection, setDetection] = useState<number>(6);

  // Compute AP rating strictly based on AIAG-VDA logic
  const calculateAP = (s: number, o: number, d: number): { ap: 'High' | 'Medium' | 'Low'; color: string; bg: string } => {
    if (s >= 8 && (o >= 6 || d >= 6)) return { ap: 'High', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
    if (s >= 6 && o >= 4 && d >= 4) return { ap: 'Medium', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
    return { ap: 'Low', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
  };

  const currentRisk = calculateAP(severity, occurrence, detection);
  const rpnBefore = severity * occurrence * detection;

  // AI-optimized simulated post-action scores
  const aiOccurrence = Math.max(1, Math.floor(occurrence * 0.3));
  const aiDetection = Math.max(1, Math.floor(detection * 0.3));
  const aiRisk = calculateAP(severity, aiOccurrence, aiDetection);
  const rpnAfter = severity * aiOccurrence * aiDetection;
  const reductionPercent = Math.round(((rpnBefore - rpnAfter) / rpnBefore) * 100);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 4,
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        border: '1px solid rgba(13, 148, 136, 0.2)',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08), 0 0 20px rgba(13, 148, 136, 0.05)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Analytics sx={{ color: 'secondary.main', fontSize: '1.8rem' }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Interactive AIAG-VDA Risk Reduction Simulator
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        Adjust the Severity (S), Occurrence (O), and Detection (D) sliders to test live Action Priority (AP) calculation and AI copilot risk mitigation.
      </Typography>

      <Grid container spacing={4} sx={{ alignItems: 'center' }}>
        {/* Sliders Input Column */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Severity Slider */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Severity (S): {severity}/10
              </Typography>
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                {severity >= 8 ? 'Critical Hazard' : severity >= 5 ? 'Moderate Impact' : 'Minor Impact'}
              </Typography>
            </Box>
            <Slider
              value={severity}
              min={1}
              max={10}
              step={1}
              onChange={(_, v) => setSeverity(v as number)}
              sx={{ color: '#EF4444' }}
            />
          </Box>

          {/* Occurrence Slider */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Occurrence (O): {occurrence}/10
              </Typography>
              <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>
                {occurrence >= 7 ? 'Frequent Failure' : occurrence >= 4 ? 'Occasional' : 'Remote'}
              </Typography>
            </Box>
            <Slider
              value={occurrence}
              min={1}
              max={10}
              step={1}
              onChange={(_, v) => setOccurrence(v as number)}
              sx={{ color: '#F59E0B' }}
            />
          </Box>

          {/* Detection Slider */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Detection (D): {detection}/10
              </Typography>
              <Typography variant="caption" sx={{ color: 'info.main', fontWeight: 600 }}>
                {detection >= 7 ? 'Poor Control' : detection >= 4 ? 'Moderate Control' : 'High Control'}
              </Typography>
            </Box>
            <Slider
              value={detection}
              min={1}
              max={10}
              step={1}
              onChange={(_, v) => setDetection(v as number)}
              sx={{ color: '#0D9488' }}
            />
          </Box>
        </Grid>

        {/* Results Comparison Column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Before Risk Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Before Action
              </Typography>
              <Box sx={{ my: 1.5 }}>
                <Chip
                  label={`${currentRisk.ap} AP`}
                  sx={{
                    bgcolor: currentRisk.bg,
                    color: currentRisk.color,
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    px: 1,
                  }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {rpnBefore}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                RPN (S×O×D)
              </Typography>
            </Paper>

            {/* After AI Copilot Risk Card */}
            <motion.div animate={{ scale: [0.97, 1.02, 1] }} transition={{ duration: 0.3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: '#F0FDF4',
                  border: '1.5px solid #0D9488',
                  textAlign: 'center',
                  boxShadow: '0 0 15px rgba(13, 148, 136, 0.15)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                  <Psychology sx={{ color: '#0D9488', fontSize: '1rem' }} />
                  <Typography variant="caption" sx={{ color: '#0D9488', fontWeight: 800, textTransform: 'uppercase' }}>
                    With AI Copilot
                  </Typography>
                </Box>
                <Box sx={{ my: 1 }}>
                  <Chip
                    label={`${aiRisk.ap} AP`}
                    sx={{
                      bgcolor: aiRisk.bg,
                      color: aiRisk.color,
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      px: 1,
                    }}
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0D9488' }}>
                  {rpnAfter}
                </Typography>
                <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 700 }}>
                  -{reductionPercent}% Risk Reduction
                </Typography>
              </Paper>
            </motion.div>
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => navigate('/login')}
            endIcon={<ArrowForward />}
            sx={{
              mt: 3,
              bgcolor: 'secondary.main',
              color: '#ffffff',
              fontWeight: 700,
              py: 1.2,
              '&:hover': { bgcolor: 'secondary.dark' },
            }}
          >
            Start Mitigating Risk Free
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};
