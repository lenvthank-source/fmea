import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
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
} from '@mui/icons-material';

export interface FmeaTutorialGuideProps {
  open: boolean;
  onClose: () => void;
  onSkipAll: () => void;
}

interface TutorialStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  whatIsIt: string;
  howToUse: string;
  complianceTip: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    stepNumber: 1,
    title: 'Step 1: Planning & Preparation (5Ts & Scope)',
    subtitle: 'Define project boundaries, team members, timing, and standards',
    icon: <PlanningIcon sx={{ fontSize: 28 }} />,
    color: '#0284c7', // Sky blue
    whatIsIt:
      'Planning & Preparation establishes the project scope, cross-functional team (CFT), timing milestones, and customer specifications using the 5Ts framework (In-Scope, Out-of-Scope, Team, Timing, Tools).',
    howToUse:
      'Review the Project Quality Headers at the top of the workspace. Confirm part numbers, drawing revision dates, customer engineering criteria, and add all CFT members before proceeding.',
    complianceTip:
      'AIAG-VDA Entry Criteria: Step 1 must be initialized with document scope and customer identifiers before structural elements can be created.',
  },
  {
    stepNumber: 2,
    title: 'Step 2: Structure Analysis (PFD & Elements)',
    subtitle: 'Map process hierarchy: Process Item → Process Steps → 4M Work Elements',
    icon: <StructureIcon sx={{ fontSize: 28 }} />,
    color: '#2563eb', // Blue
    whatIsIt:
      'Structure Analysis breaks down the manufacturing line into a structural tree: Process Item (final product) → Process Steps (individual operations: OP10, OP20) → Work Elements (4M: Man, Machine, Material, Environment).',
    howToUse:
      'Use the PFD Workspace or the PFMEA Structure Tree View. Click "+ Step" to sequence operations, then add Work Elements under each step to specify tooling, operators, or fixtures.',
    complianceTip:
      'Bidirectional Rule: A PFMEA row cannot reference a process step that is missing from the Process Flow Diagram (PFD).',
  },
  {
    stepNumber: 3,
    title: 'Step 3: Function Analysis (Process & Item Functions)',
    subtitle: 'Define intended positive requirements, tolerances, and specifications',
    icon: <FunctionIcon sx={{ fontSize: 28 }} />,
    color: '#059669', // Emerald
    whatIsIt:
      'Function Analysis defines what each process step and work element must achieve. It details product characteristics (diameters, hardness) and process characteristics (temperature, torque, feed rate).',
    howToUse:
      'In the Structure Tree or Table View, click "Add Function" to attach positive functions and engineering tolerances to the process item, step, or work element.',
    complianceTip:
      'Special Characteristics: All critical/significant characteristics must flow down to the PFMEA and Control Plan as mandatory coverage items.',
  },
  {
    stepNumber: 4,
    title: 'Step 4: Failure Analysis (The Failure Chain)',
    subtitle: 'Model the complete cause-and-effect relationship',
    icon: <FailureIcon sx={{ fontSize: 28 }} />,
    color: '#d97706', // Amber
    whatIsIt:
      'Failure Analysis constructs the complete failure chain triad: Failure Cause (FC at Work Element) → Failure Mode (FM at Process Step) → Failure Effect (FE at Plant / Customer / End-User).',
    howToUse:
      'Use the Link Failures canvas or table editors to connect root causes to failure modes and their downstream effects on quality and safety.',
    complianceTip:
      'Completeness Rule: Each failure mode must link to at least one cause and one effect. Orphan failure modes are flagged as compliance warnings.',
  },
  {
    stepNumber: 5,
    title: 'Step 5: Risk Analysis (S/O/D Ratings & Action Priority)',
    subtitle: 'AIAG-VDA 2019 Severity, Occurrence, Detection, and AP logic',
    icon: <RiskIcon sx={{ fontSize: 28 }} />,
    color: '#dc2626', // Red
    whatIsIt:
      'Risk Analysis evaluates risk using integer ratings (1–10) for Severity (S: effect impact), Occurrence (O: prevention control robustness), and Detection (D: detection capability). Action Priority (AP: High, Medium, Low) is derived directly from AIAG-VDA 2019 logic.',
    howToUse:
      'Click the S, O, and D cells in the 7-Step Report Grid. Select ratings based on standardized scale descriptions. AP is calculated automatically in real time.',
    complianceTip:
      'Action Priority is a read-only field derived from AIAG-VDA standard tables. High AP rows mandate corrective action tracking.',
  },
  {
    stepNumber: 6,
    title: 'Step 6: Optimization (Corrective & Preventive Actions)',
    subtitle: 'Assign mitigation tasks, track evidence, and calculate revised risk',
    icon: <OptimizationIcon sx={{ fontSize: 28 }} />,
    color: '#7c3aed', // Purple
    whatIsIt:
      'Optimization introduces engineering actions to eliminate root causes (reduce Occurrence) or enhance inspection gates (improve Detection). Before/after risk scores track measurable risk reduction.',
    howToUse:
      'Click "+ Action" on any High or Medium AP row. Assign a responsible engineer, target date, and upload verification evidence to resolve the action.',
    complianceTip:
      'Closure Validation: An action cannot transition to "Verified" or "Closed" until evidence is uploaded and post-action (After) S/O/D ratings are assigned.',
  },
  {
    stepNumber: 7,
    title: 'Step 7: Documentation & Results (Control Plan & Sign-off)',
    subtitle: 'Synchronize Control Plan and lock 21 CFR Part 11 compliant revisions',
    icon: <DocumentIcon sx={{ fontSize: 28 }} />,
    color: '#0f172a', // Slate
    whatIsIt:
      'Documentation generates the production Control Plan directly from PFMEA controls and characteristic tolerances, and locks immutable document revisions with digital signatures.',
    howToUse:
      'Open the Control Plan workspace to view automatically mapped inspection plans. Submit document revisions for Reviewer and Approver digital sign-offs.',
    complianceTip:
      '21 CFR Part 11 Immutability: Once locked and approved, revision records and audit trails cannot be altered or deleted.',
  },
];

export const FmeaTutorialGuide: React.FC<FmeaTutorialGuideProps> = ({
  open,
  onClose,
  onSkipAll,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleSkipAll = () => {
    onSkipAll();
  };

  const progressPercent = ((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Top Header Strip with Step Progress */}
      <Box sx={{ bgcolor: '#f8fafc', px: 3, pt: 2.5, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: `${currentStep.color}15`,
                color: currentStep.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {currentStep.icon}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: currentStep.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AIAG-VDA 2019 Guide
                </Typography>
                <Chip
                  label={`Step ${currentStep.stepNumber} of 7`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: currentStep.color,
                    color: '#ffffff',
                  }}
                />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, mt: 0.25 }}>
                {currentStep.title}
              </Typography>
            </Box>
          </Box>

          <Button
            size="small"
            onClick={handleSkipAll}
            sx={{
              color: '#64748b',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              p: 0.5,
              '&:hover': { color: '#0f172a', bgcolor: 'transparent' },
            }}
          >
            Skip All
          </Button>
        </Box>

        {/* Linear Progress */}
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: 4,
            borderRadius: 2,
            bgcolor: '#e2e8f0',
            '& .MuiLinearProgress-bar': {
              bgcolor: currentStep.color,
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* Dialog Body Content */}
      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.875rem' }}>
          {currentStep.subtitle}
        </Typography>

        {/* Section 1: What is this step? */}
        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
            <GuideIcon sx={{ fontSize: 16, color: currentStep.color }} />
            1. What is this step?
          </Typography>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.55, fontSize: '0.85rem' }}>
            {currentStep.whatIsIt}
          </Typography>
        </Box>

        {/* Section 2: How to use it in FMEApex? */}
        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#ffffff', border: '1px solid #cbd5e1' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
            <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
            2. How to use it in the app:
          </Typography>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.55, fontSize: '0.85rem' }}>
            {currentStep.howToUse}
          </Typography>
        </Box>

        {/* Section 3: Compliance & Standard Rule */}
        <Box sx={{ p: 1.75, borderRadius: '10px', bgcolor: `${currentStep.color}0a`, border: `1px solid ${currentStep.color}30` }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: currentStep.color, display: 'block', mb: 0.5 }}>
            ⚡ Standard Rule:
          </Typography>
          <Typography variant="caption" sx={{ color: '#334155', display: 'block', lineHeight: 1.45, fontWeight: 500 }}>
            {currentStep.complianceTip}
          </Typography>
        </Box>
      </DialogContent>

      {/* Two Action Buttons: Skip All and Next (Mandatory Requirement) */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button
          onClick={handleSkipAll}
          variant="outlined"
          size="medium"
          sx={{
            color: '#64748b',
            borderColor: '#cbd5e1',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '9px',
            px: 2.5,
            fontSize: '0.85rem',
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
          size="medium"
          endIcon={isLastStep ? <CheckIcon /> : <NextIcon />}
          sx={{
            bgcolor: currentStep.color,
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '9px',
            px: 3,
            fontSize: '0.85rem',
            boxShadow: '0 2px 8px -2px rgba(0,0,0,0.2)',
            '&:hover': {
              bgcolor: currentStep.color,
              filter: 'brightness(0.92)',
            },
          }}
        >
          {isLastStep ? 'Get Started' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FmeaTutorialGuide;
