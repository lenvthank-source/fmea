import processStepImg from '../../assets/process-step.png';
import workElementImg from '../../assets/work-element.png';
import functionImg from '../../assets/function.png';
import failureImg from '../../assets/failure.png';

export const TREE_COLORS = {
  text: '#111827',              // Carbon Black default
  textSecondary: '#4B5563',     // Secondary text
  connectorLine: '#D0D0D0',     // Solid light gray connector lines
  hoverBg: '#F3F4F6',           // Light gray row hover background
  selectedBorder: '#1D4ED8',    // Left border accent for selected node
  selectedBg: '#EFF6FF',        // Background tint for selected node
  chevron: '#6B7280',           // Chevron icon color

  // Specific text colors per node type (User Spec)
  nodeText: {
    root:      '#1E40AF',  // Deep Royal Blue
    process:   '#1D4ED8',  // Blue
    workElem:  '#111827',  // Carbon Black
    function:  '#15803D',  // Forest Green
    failure:   '#DC2626',  // Crimson Red
    linked:    '#0284C7',  // Deep Cyan/Blue
  },

  iconBg: {
    root:      '#E8F0FE',
    process:   '#FEF2E8',
    workElem:  '#F3ECFB',
    function:  '#EAF7EE',
    failure:   '#FDEDEA',
    linked:    '#E0F2FE',
  },

  iconBorder: {
    root:      '#93C5FD',
    process:   '#FDBA74',
    workElem:  '#D8B4FE',
    function:  '#86EFAC',
    failure:   '#FCA5A5',
    linked:    '#7DD3FC',
  },

  iconColor: {
    root:      '#1E40AF',
    process:   '#1D4ED8',
    workElem:  '#111827',
    function:  '#15803D',
    failure:   '#DC2626',
    linked:    '#0284C7',
  }
};

export const TREE_TYPOGRAPHY = {
  root:     { fontSize: '16px', fontWeight: 700, color: TREE_COLORS.nodeText.root },
  process:  { fontSize: '15px', fontWeight: 600, color: TREE_COLORS.nodeText.process },
  workElem: { fontSize: '15px', fontWeight: 600, color: TREE_COLORS.nodeText.workElem },
  function: { fontSize: '15px', fontWeight: 600, color: TREE_COLORS.nodeText.function },
  failure:  { fontSize: '14px', fontWeight: 600, color: TREE_COLORS.nodeText.failure },
  linked:   { fontSize: '14px', fontWeight: 600, color: TREE_COLORS.nodeText.linked },
};

export const TREE_ASSETS = {
  processStep: processStepImg,
  workElement: workElementImg,
  function: functionImg,
  failure: failureImg,
};
