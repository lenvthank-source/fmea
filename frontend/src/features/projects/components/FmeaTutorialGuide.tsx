import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  ArrowForward as NextIcon,
  CheckCircle as CheckIcon,
  HelpOutlined as GuideIcon,
  FactCheck as PlanningIcon,
  AccountTree as StructureIcon,
  Functions as FunctionIcon,
  ReportProblem as FailureIcon,
  Speed as RiskIcon,
  Engineering as OptimizationIcon,
  Description as DocumentIcon,
  Close as CloseIcon,
  Remove as MinimizeIcon,
  OpenInFull as ExpandIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';

export interface FmeaTutorialGuideProps {
  open: boolean;
  onClose: () => void;
  onSkipAll: () => void;
  projectId?: string;
}

interface TutorialStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  targetRoute: string;
  actionText: string;
  whatIsIt: string;
  howToUse: string;
  complianceTip: string;
}

const DEMO_PROJECT_ID = 'c439cfbe-548a-4e25-a37c-0194652b8526';

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    stepNumber: 1,
    title: 'Step 1: Planning & Scope (5Ts)',
    subtitle: 'Define boundaries, cross-functional team (CFT), timing milestones, and customer specifications.',
    icon: <PlanningIcon sx={{ fontSize: 22 }} />,
    color: '#0284c7', // Sky blue
    targetRoute: '/app/projects',
    actionText: 'View Scope & Quality Headers (Step 1)',
    whatIsIt:
      'Planning & Preparation establishes the 5Ts framework (Scope, CFT, Timing, Tools, Tasks) and ensures customer engineering specifications are locked.',
    howToUse:
      'Confirm part numbers, drawing revision dates, and customer engineering criteria on the project card. Ensure all CFT members are assigned before structural analysis.',
    complianceTip:
      'AIAG-VDA Rule: Step 1 scope and customer identifiers must be initialized before structure rows can be added.',
  },
  {
    stepNumber: 2,
    title: 'Step 2: Structure Analysis (PFD)',
    subtitle: 'Map manufacturing sequence: Process Item → Process Steps (OP10, OP20) → 4M Work Elements.',
    icon: <StructureIcon sx={{ fontSize: 22 }} />,
    color: '#2563eb', // Blue
    targetRoute: `/app/projects/${DEMO_PROJECT_ID}/pfd`,
    actionText: 'Open Process Flow Diagram (Step 2) →',
    whatIsIt:
      'Structure Analysis breaks down the manufacturing line into a structural tree: Process Steps (operations) and Work Elements (Machine, Man, Material, Method).',
    howToUse:
      'In the PFD workspace, review OP10 Bush Pressing and OP20 Pump Assembly. By default, steps are collapsed for clear ergonomics; click any step to expand details.',
    complianceTip:
      'Bidirectional Rule: A PFMEA row cannot reference an operation that does not exist in the Process Flow Diagram (PFD).',
  },
  {
    stepNumber: 3,
    title: 'Step 3: Function Analysis',
    subtitle: 'Define intended positive functions, product tolerances, and process specifications.',
    icon: <FunctionIcon sx={{ fontSize: 22 }} />,
    color: '#059669', // Emerald
    targetRoute: `/app/projects/${DEMO_PROJECT_ID}/pfmea?tab=tree`,
    actionText: 'Open Structure Tree & Functions (Step 3) →',
    whatIsIt:
      'Function Analysis describes what each process step and tooling fixture must achieve, linking characteristics directly to engineering specifications.',
    howToUse:
      'Review attached tolerances (e.g. Bush press depth 45.2 ± 0.1 mm, screw tightening torque 2.5 ~ 4.0 Nm). Special characteristics (SC/CC) are tagged for downstream coverage.',
    complianceTip:
      'Special Characteristics: All CC/SC items identified here flow down automatically to the Control Plan as mandatory verification items.',
  },
  {
    stepNumber: 4,
    title: 'Step 4: Failure Analysis (The Failure Chain)',
    subtitle: 'Construct the cause-and-effect chain: Failure Cause → Failure Mode → Failure Effect.',
    icon: <FailureIcon sx={{ fontSize: 22 }} />,
    color: '#d97706', // Amber
    targetRoute: `/app/projects/${DEMO_PROJECT_ID}/linkage`,
    actionText: 'Open Failure Chain Network (Step 4) →',
    whatIsIt:
      'Failure Analysis constructs complete failure chains: Cause (tooling/parameter drift) → Mode (step non-conformance) → Effect (customer/vehicle impact).',
    howToUse:
      'Use the Link Failures canvas or table editors to verify that every failure mode links to at least one root cause and one downstream effect.',
    complianceTip:
      'Completeness Rule: Orphan failure modes with missing causes or effects are strictly flagged as compliance warnings.',
  },
  {
    stepNumber: 5,
    title: 'Step 5: Risk Analysis (S/O/D & AP)',
    subtitle: 'Evaluate ratings [1–10]. Action Priority (AP: High, Med, Low) is calculated deterministically.',
    icon: <RiskIcon sx={{ fontSize: 22 }} />,
    color: '#dc2626', // Red
    targetRoute: `/app/projects/${DEMO_PROJECT_ID}/pfmea?tab=table`,
    actionText: 'Open PFMEA 7-Step Risk Grid (Step 5) →',
    whatIsIt:
      'Risk Analysis replaces flawed legacy RPN with deterministic AIAG-VDA 2019 Action Priority lookup tables based on Severity, Occurrence, and Detection.',
    howToUse:
      'Click the S, O, and D rating cells in the PFMEA grid. The Action Priority (High, Med, Low) updates automatically according to AIAG-VDA tables.',
    complianceTip:
      'Action Priority is read-only and cannot be manually overridden. High AP rows mandate corrective action tracking.',
  },
  {
    stepNumber: 6,
    title: 'Step 6: Optimization & Actions',
    subtitle: 'Assign corrective/preventive actions, upload evidence, and verify post-action risk reduction.',
    icon: <OptimizationIcon sx={{ fontSize: 22 }} />,
    color: '#7c3aed', // Purple
    targetRoute: '/app/actions',
    actionText: 'Open Actions & Evidence Dashboard (Step 6) →',
    whatIsIt:
      'Optimization introduces engineering controls to eliminate root causes or improve detection. Actions are tracked through digital evidence to verify risk reduction.',
    howToUse:
      'View assigned corrective actions (e.g. Servo press closed-loop dynamic envelope, MES torque logging). Upload evidence files and assign After ratings.',
    complianceTip:
      'Closure Gate: Actions cannot transition to Verified or Closed without evidence files and evaluated post-action S/O/D ratings.',
  },
  {
    stepNumber: 7,
    title: 'Step 7: Documentation & Audit',
    subtitle: 'Synchronize Control Plan, execute 21 CFR Part 11 electronic signatures, and lock revisions.',
    icon: <DocumentIcon sx={{ fontSize: 22 }} />,
    color: '#0f172a', // Slate
    targetRoute: `/app/projects/${DEMO_PROJECT_ID}/control-plan`,
    actionText: 'Open Control Plan & Documentation (Step 7) →',
    whatIsIt:
      'Documentation generates the production Control Plan directly from PFMEA controls and characteristic tolerances, locking immutable revisions with digital signatures.',
    howToUse:
      'Inspect the Control Plan workspace to see mapped evaluation techniques and reaction plans. Approved revisions are permanently locked in the immutable audit log.',
    complianceTip:
      '21 CFR Part 11 Immutability: Once a revision is locked and approved, all modifications are blocked and recorded in the audit trail.',
  },
];

export const FmeaTutorialGuide: React.FC<FmeaTutorialGuideProps> = ({
  open,
  onClose,
  onSkipAll,
  projectId = DEMO_PROJECT_ID,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);

  // Auto-sync guide with active screen so tutorial is linked to each step
  useEffect(() => {
    const path = location.pathname;
    const search = location.search;
    if (path.includes('/pfd')) {
      setCurrentStepIndex(1); // Step 2: Structure / PFD
    } else if (path.includes('/linkage')) {
      setCurrentStepIndex(3); // Step 4: Failure Analysis (Failure Chain Network)
    } else if (path.includes('/pfmea')) {
      if (search.includes('tab=table') || search.includes('tab=grid') || search.includes('report')) {
        setCurrentStepIndex(4); // Step 5: Risk Analysis (7-Step Risk Grid)
      } else {
        setCurrentStepIndex(2); // Step 3: Function Analysis (Tree View)
      }
    } else if (path.includes('/actions')) {
      setCurrentStepIndex(5); // Step 6: Optimization
    } else if (path.includes('/control-plan') || path.includes('/cp')) {
      setCurrentStepIndex(6); // Step 7: Documentation
    } else {
      setCurrentStepIndex(0); // Step 1: Project Scope
    }
  }, [location.pathname, location.search]);

  if (!open) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;
  const progressPercent = ((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      // Seamlessly navigate to next step's screen
      const nextStep = TUTORIAL_STEPS[nextIndex];
      const target = nextStep.targetRoute.includes(':id')
        ? nextStep.targetRoute.replace(':id', projectId)
        : nextStep.targetRoute;
      navigate(target);
    }
  };

  const handleSkipAll = () => {
    sessionStorage.setItem('fmea_tutorial_dismissed', 'true');
    onSkipAll();
  };

  const handleJumpToStep = (index: number) => {
    setCurrentStepIndex(index);
    const target = TUTORIAL_STEPS[index].targetRoute.includes(':id')
      ? TUTORIAL_STEPS[index].targetRoute.replace(':id', projectId)
      : TUTORIAL_STEPS[index].targetRoute;
    navigate(target);
  };

  const handleNavigateCurrentStep = () => {
    const target = currentStep.targetRoute.includes(':id')
      ? currentStep.targetRoute.replace(':id', projectId)
      : currentStep.targetRoute;
    navigate(target);
  };

  // ── Minimized Floating Pill View (Figma-style) ──────────
  if (minimized) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 72, sm: 80 },
          right: 24,
          zIndex: 1300,
          bgcolor: '#0f172a',
          color: '#ffffff',
          borderRadius: '12px',
          p: 1.25,
          px: 2,
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          border: '1px solid #334155',
          animation: 'fadeIn 0.2s ease-in-out',
        }}
        onClick={() => setMinimized(false)}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: currentStep.color,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 800,
          }}
        >
          {currentStep.stepNumber}
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.775rem', fontWeight: 700, color: '#f8fafc' }}>
            7-Step Guide: Step {currentStep.stepNumber}
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            Click to expand walkthrough
          </Typography>
        </Box>
        <Tooltip title="Expand Guide">
          <IconButton
            size="small"
            sx={{ color: '#cbd5e1', p: 0.25, ml: 1, '&:hover': { color: '#ffffff' } }}
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(false);
            }}
          >
            <ExpandIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  // ── Full Floating Step Guide Card (Docked Figma-style) ──
  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: { xs: 72, sm: 80 },
        right: { xs: 12, sm: 24 },
        zIndex: 1300,
        width: { xs: 'calc(100vw - 24px)', sm: 460 },
        maxWidth: 480,
        borderRadius: '16px',
        bgcolor: '#ffffff',
        border: '1px solid #cbd5e1',
        boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.22)',
        overflow: 'hidden',
        animation: 'slideUp 0.2s ease-out',
        '@keyframes slideUp': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* ── Header: Title, Step Pill, Minimize & Close ──────── */}
      <Box
        sx={{
          px: 2.25,
          py: 1.5,
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '7px',
              bgcolor: currentStep.color,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentStep.icon}
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.825rem', fontWeight: 800, color: '#09090b', lineHeight: 1.2 }}>
              AIAG-VDA 7-Step Guide
            </Typography>
            <Typography sx={{ fontSize: '0.675rem', color: '#64748b', fontWeight: 600 }}>
              Step {currentStep.stepNumber} of 7 • Interactive Walkthrough
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Minimize to Pill">
            <IconButton
              size="small"
              onClick={() => setMinimized(true)}
              sx={{ color: '#64748b', p: 0.5, '&:hover': { bgcolor: '#e2e8f0' } }}
            >
              <MinimizeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close Guide">
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: '#64748b', p: 0.5, '&:hover': { bgcolor: '#e2e8f0' } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={progressPercent}
        sx={{
          height: 3,
          bgcolor: '#e2e8f0',
          '& .MuiLinearProgress-bar': { bgcolor: currentStep.color },
        }}
      />

      {/* ── Step Quick-Jump Nav Pills (1 to 7) ──────────────── */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 0.5,
        }}
      >
        {TUTORIAL_STEPS.map((s, idx) => {
          const isActive = idx === currentStepIndex;
          const isDone = idx < currentStepIndex;
          return (
            <Tooltip key={s.stepNumber} title={s.title}>
              <Box
                onClick={() => handleJumpToStep(idx)}
                sx={{
                  flex: 1,
                  py: 0.5,
                  borderRadius: '6px',
                  bgcolor: isActive ? `${s.color}18` : isDone ? '#f1f5f9' : 'transparent',
                  border: isActive ? `1.5px solid ${s.color}` : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: `${s.color}12` },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.675rem',
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? s.color : isDone ? '#0f172a' : '#94a3b8',
                  }}
                >
                  Step {s.stepNumber}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* ── Step Body Content (Linked to this step) ─────────── */}
      <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '60vh', overflowY: 'auto' }}>
        {/* Step Title & Subtitle */}
        <Box>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.01em' }}>
            {currentStep.title}
          </Typography>
          <Typography sx={{ fontSize: '0.775rem', color: '#475569', mt: 0.25, lineHeight: 1.45 }}>
            {currentStep.subtitle}
          </Typography>
        </Box>

        {/* Action Link: Direct button to navigate to this step's actual screen */}
        <Button
          variant="outlined"
          size="small"
          onClick={handleNavigateCurrentStep}
          startIcon={<LaunchIcon sx={{ fontSize: 15 }} />}
          sx={{
            py: 0.75,
            px: 1.5,
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: '0.775rem',
            fontWeight: 700,
            borderColor: `${currentStep.color}60`,
            color: currentStep.color,
            bgcolor: `${currentStep.color}08`,
            justifyContent: 'flex-start',
            '&:hover': {
              borderColor: currentStep.color,
              bgcolor: `${currentStep.color}15`,
            },
          }}
        >
          {currentStep.actionText}
        </Button>

        {/* Section: How to use it on this screen */}
        <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GuideIcon sx={{ fontSize: 14, color: currentStep.color }} />
            How to use on this screen:
          </Typography>
          <Typography sx={{ fontSize: '0.775rem', color: '#334155', lineHeight: 1.5 }}>
            {currentStep.howToUse}
          </Typography>
        </Box>

        {/* Standard Rule Banner */}
        <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: `${currentStep.color}0a`, border: `1px solid ${currentStep.color}30` }}>
          <Typography sx={{ fontSize: '0.675rem', fontWeight: 800, color: currentStep.color, textTransform: 'uppercase', mb: 0.25 }}>
            AIAG-VDA 2019 Standard Rule:
          </Typography>
          <Typography sx={{ fontSize: '0.725rem', color: '#334155', fontWeight: 500, lineHeight: 1.4 }}>
            {currentStep.complianceTip}
          </Typography>
        </Box>
      </Box>

      {/* ── Footer: Strictly TWO Buttons (Next and Skip All) ── */}
      <Box
        sx={{
          px: 2.25,
          py: 1.5,
          bgcolor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Button
          onClick={handleSkipAll}
          variant="outlined"
          size="small"
          sx={{
            color: '#64748b',
            borderColor: '#cbd5e1',
            textTransform: 'none',
            fontWeight: 650,
            borderRadius: '8px',
            px: 2,
            height: 34,
            fontSize: '0.775rem',
            '&:hover': {
              borderColor: '#94a3b8',
              bgcolor: '#f8fafc',
              color: '#0f172a',
            },
          }}
        >
          Skip All
        </Button>

        <Button
          onClick={handleNext}
          variant="contained"
          size="small"
          endIcon={isLastStep ? <CheckIcon sx={{ fontSize: 16 }} /> : <NextIcon sx={{ fontSize: 16 }} />}
          sx={{
            bgcolor: currentStep.color,
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 750,
            borderRadius: '8px',
            px: 2.5,
            height: 34,
            fontSize: '0.8rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            '&:hover': {
              bgcolor: currentStep.color,
              filter: 'brightness(0.92)',
              boxShadow: 'none',
            },
          }}
        >
          {isLastStep ? 'Complete Tutorial' : 'Next'}
        </Button>
      </Box>
    </Paper>
  );
};

export default FmeaTutorialGuide;
