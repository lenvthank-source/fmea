import processStepImg from '../../assets/process-step.png';
import workElementImg from '../../assets/work-element.png';
import functionImg from '../../assets/function.png';
import failureImg from '../../assets/failure.png';

export const TREE_COLORS = {
  text: '#2D2D2D',              // Neutral dark gray for all node text
  textSecondary: '#6B7280',     // Secondary text
  connectorLine: '#D0D0D0',     // Solid light gray connector lines
  hoverBg: '#F5F6F8',           // Light gray row hover background
  selectedBorder: '#4F46E5',    // Left border accent for selected node
  selectedBg: '#F5F3FF',        // Background tint for selected node
  chevron: '#9CA3AF',           // Chevron icon color

  // Pastel circular icon container backgrounds
  iconBg: {
    root:      '#E8F0FE',  // Soft blue — Root/System
    process:   '#FEF2E8',  // Soft orange — Step/Element
    workElem:  '#F3ECFB',  // Soft purple — Work Element
    function:  '#EAF7EE',  // Soft green — Function
    failure:   '#FDEDEA',  // Soft red — Failure Mode (unlinked)
    linked:    '#E0F2FE',  // Soft cyan — Failure Mode (linked)
  },

  // Circle border colors
  iconBorder: {
    root:      '#93C5FD',
    process:   '#FDBA74',
    workElem:  '#D8B4FE',
    function:  '#86EFAC',
    failure:   '#FCA5A5',
    linked:    '#7DD3FC',
  },

  // Icon tint/primary color
  iconColor: {
    root:      '#1E40AF',
    process:   '#C2410C',
    workElem:  '#7C3AED',
    function:  '#15803D',
    failure:   '#DC2626',
    linked:    '#0369A1',
  }
};

export const TREE_TYPOGRAPHY = {
  root:     { fontSize: '14px', fontWeight: 600, color: '#2D2D2D' },
  process:  { fontSize: '13px', fontWeight: 500, color: '#2D2D2D' },
  function: { fontSize: '13px', fontWeight: 400, color: '#2D2D2D' },
  failure:  { fontSize: '12px', fontWeight: 400, color: '#2D2D2D' },
};

export const TREE_ASSETS = {
  processStep: processStepImg,
  workElement: workElementImg,
  function: functionImg,
  failure: failureImg,
};
