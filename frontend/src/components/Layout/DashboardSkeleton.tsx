import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, Grid, Skeleton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const LOADING_PHRASES = [
  "We are baking it up... 🍕",
  "Hold tight, we are gathering the tools... 🛠️",
  "Buckle up, details are arriving... 🚀",
  "Waking up the engine... ⚡",
  "Just arrived... ☕",
  "Connecting to the database... ⚙️",
  "Preparing your workspace... 📋"
];

interface DashboardSkeletonProps {
  showMascot?: boolean;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ showMascot = true }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!showMascot) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [showMascot]);

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* Styles for CSS Animations */}
      {showMascot && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          @keyframes wave {
            0% { transform: translateX(0px); }
            100% { transform: translateX(-40px); }
          }
          @keyframes tailWag {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(15deg); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          .floating-mascot {
            animation: float 3s ease-in-out infinite;
          }
          .bouncing-activity {
            animation: bounce 0.6s ease-in-out infinite;
          }
          .wagging-tail {
            animation: tailWag 0.3s ease-in-out infinite;
            transform-origin: 20px 45px;
          }
          .wave-flow {
            animation: wave 1.5s linear infinite;
          }
        `}} />
      )}

      {/* Top Header Row Skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ width: '40%' }}>
          <Skeleton variant="text" height={40} width="60%" sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" height={20} width="90%" sx={{ mt: 1, borderRadius: 1 }} />
        </Box>
        <Skeleton variant="rectangular" width={140} height={36} sx={{ borderRadius: 2 }} />
      </Box>

      {/* Main Grid Skeleton (Projects list representation) */}
      <Grid container spacing={3} sx={{ opacity: showMascot ? 0.35 : 1, transition: 'opacity 0.5s ease-in-out' }}>
        <Grid size={12}>
          <TableContainer component={Paper} sx={{ border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 3, boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(40, 37, 29, 0.02)' }}>
                <TableRow>
                  <TableCell><Skeleton width={120} height={20} /></TableCell>
                  <TableCell><Skeleton width={200} height={20} /></TableCell>
                  <TableCell><Skeleton width={80} height={20} /></TableCell>
                  <TableCell><Skeleton width={80} height={20} /></TableCell>
                  <TableCell><Skeleton width={100} height={20} /></TableCell>
                  <TableCell align="center"><Skeleton width={50} height={20} /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton width={140} height={20} sx={{ bgcolor: 'rgba(13, 148, 136, 0.08)' }} /></TableCell>
                    <TableCell><Skeleton width="90%" height={20} /></TableCell>
                    <TableCell><Skeleton width={70} height={20} /></TableCell>
                    <TableCell><Skeleton width={50} height={20} /></TableCell>
                    <TableCell><Skeleton width={90} height={20} /></TableCell>
                    <TableCell align="center"><Skeleton variant="circular" width={24} height={24} sx={{ display: 'inline-block' }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Playful Central Mascot Modal (For Wake-up UX) */}
      {showMascot && (
        <Box
          sx={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            width: '100%',
            maxWidth: 420,
            textAlign: 'center',
            px: 2,
          }}
        >
          <Card
            sx={{
              p: 4,
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
              border: '1px solid rgba(13, 148, 136, 0.12)',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Custom SVG Surfing Cat Mascot */}
            <Box className="floating-mascot" sx={{ width: 140, height: 110, mb: 2 }}>
              <svg width="100%" height="100%" viewBox="0 0 140 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Wavy Water Background */}
                <g opacity="0.7">
                  <path className="wave-flow" d="M-20,95 Q10,88 40,95 T100,95 T160,95" stroke="#006494" strokeWidth="3" strokeLinecap="round" />
                  <path className="wave-flow" d="M-10,102 Q20,96 50,102 T110,102 T170,102" stroke="#01696F" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
                </g>

                {/* Surfboard */}
                <g className="bouncing-activity" style={{ animationDelay: '0.1s' }}>
                  <path d="M15,85 C45,82 95,82 125,85 C110,92 40,92 15,85 Z" fill="#01696F" />
                  <rect x="55" y="84" width="30" height="2" fill="#D19900" />
                </g>

                {/* Cat Mascot */}
                <g className="bouncing-activity">
                  {/* Cat Body */}
                  <rect x="50" y="45" width="40" height="30" rx="15" fill="#7A7974" />
                  {/* Cat Head */}
                  <circle cx="70" cy="40" r="18" fill="#7A7974" />
                  {/* Cat Ears */}
                  <polygon points="56,26 64,28 58,15" fill="#28251D" />
                  <polygon points="84,26 76,28 82,15" fill="#28251D" />
                  {/* Cat Eyes */}
                  <circle cx="64" cy="38" r="2" fill="#F7F6F2" />
                  <circle cx="64" cy="38" r="1" fill="#28251D" />
                  <circle cx="76" cy="38" r="2" fill="#F7F6F2" />
                  <circle cx="76" cy="38" r="1" fill="#28251D" />
                  {/* Cat Nose & Whiskers */}
                  <polygon points="69,43 71,43 70,45" fill="#A13544" />
                  <line x1="52" y1="44" x2="62" y2="43" stroke="#28251D" strokeWidth="0.8" />
                  <line x1="52" y1="48" x2="62" y2="46" stroke="#28251D" strokeWidth="0.8" />
                  <line x1="88" y1="44" x2="78" y2="43" stroke="#28251D" strokeWidth="0.8" />
                  <line x1="88" y1="48" x2="78" y2="46" stroke="#28251D" strokeWidth="0.8" />
                  {/* Cat Paws */}
                  <circle cx="58" cy="74" r="5" fill="#BAB9B4" />
                  <circle cx="82" cy="74" r="5" fill="#BAB9B4" />
                  {/* Wagging Tail */}
                  <path className="wagging-tail" d="M48,55 Q35,48 25,58" stroke="#7A7974" strokeWidth="5" strokeLinecap="round" fill="none" />
                </g>
              </svg>
            </Box>

            {/* Cycling Loading Phrase */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                mb: 1,
                minHeight: 32,
                transition: 'all 0.3s ease-in-out'
              }}
            >
              {LOADING_PHRASES[phraseIndex]}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '85%', mx: 'auto' }}>
              Setting up your secure environment. This will only take a moment.
            </Typography>
          </Card>
        </Box>
      )}
    </Box>
  );
};
