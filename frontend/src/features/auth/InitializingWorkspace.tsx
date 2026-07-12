import React, { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LOADER_STEPS = [
  'Initializing secure workspace...',
  'Syncing active FMEA revisions...',
  'Loading AIAG-VDA 7-step criteria...',
  'Optimizing hierarchy trees...',
];

export const InitializingWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Increment step every 500ms
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < LOADER_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 500);

    // Smoothly progress to 100% over 2000ms (100 ticks of 20ms)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    // Redirect after 2.1 seconds
    const timeout = setTimeout(() => {
      navigate('/app/projects', { replace: true });
    }, 2100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="xs" sx={{ textAlign: 'center' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #0D9488, #2563eb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1.5,
          }}
        >
          FMEApex
        </Typography>

        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(13, 148, 136, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#0D9488',
                borderRadius: 3,
                background: 'linear-gradient(90deg, #0D9488 0%, #2563eb 100%)',
              },
            }}
          />
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontWeight: 500,
            minHeight: 20,
            transition: 'opacity 0.25s ease',
          }}
        >
          {LOADER_STEPS[currentStep]}
        </Typography>
      </Container>
    </Box>
  );
};
