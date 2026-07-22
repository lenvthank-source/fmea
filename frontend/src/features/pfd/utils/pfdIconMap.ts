export interface PfdIconMeta {
  key: string;
  label: string;
  short: string;
  sym: string;
  iconPath: string;
  fileName: string;
  bg: string;
  text: string;
  shadow: string;
}

export const PFD_ICON_MAP: Record<string, PfdIconMeta> = {
  oper: {
    key: 'oper',
    label: 'OPERATION',
    short: 'OPER',
    sym: '◯',
    iconPath: '/icons/pfd/operation.svg',
    fileName: 'operation.svg',
    bg: '#01696F',
    text: '#ffffff',
    shadow: 'rgba(1, 105, 111, 0.25)',
  },
  insp: {
    key: 'insp',
    label: 'INSPEC.',
    short: 'INSP',
    sym: '□',
    iconPath: '/icons/pfd/inspect.svg',
    fileName: 'inspect.svg',
    bg: '#ca8a04',
    text: '#ffffff',
    shadow: 'rgba(202, 138, 4, 0.25)',
  },
  trans: {
    key: 'trans',
    label: 'TRANS.',
    short: 'TRNS',
    sym: '⇨',
    iconPath: '/icons/pfd/transportation.svg',
    fileName: 'transportation.svg',
    bg: '#10b981',
    text: '#ffffff',
    shadow: 'rgba(16, 185, 129, 0.25)',
  },
  store: {
    key: 'store',
    label: 'STORE',
    short: 'STR',
    sym: '▽',
    iconPath: '/icons/pfd/Storage.svg',
    fileName: 'Storage.svg',
    bg: '#8b5cf6',
    text: '#ffffff',
    shadow: 'rgba(139, 92, 246, 0.25)',
  },
  wip: {
    key: 'wip',
    label: 'WIP @ Line',
    short: 'WIP',
    sym: '☉',
    iconPath: '/icons/pfd/WIP.svg',
    fileName: 'WIP.svg',
    bg: '#3b82f6',
    text: '#ffffff',
    shadow: 'rgba(59, 130, 246, 0.25)',
  },
  rework: {
    key: 'rework',
    label: 'REWORK',
    short: 'REW',
    sym: 'Ⓡ',
    iconPath: '/icons/pfd/rework.svg',
    fileName: 'rework.svg',
    bg: '#f97316',
    text: '#ffffff',
    shadow: 'rgba(249, 115, 22, 0.25)',
  },
  reject: {
    key: 'reject',
    label: 'REJECT',
    short: 'REJ',
    sym: '✕',
    iconPath: '/icons/pfd/reject.svg',
    fileName: 'reject.svg',
    bg: '#dc2626',
    text: '#ffffff',
    shadow: 'rgba(220, 38, 38, 0.25)',
  },
  decs: {
    key: 'decs',
    label: 'DECS.',
    short: 'DEC',
    sym: '◇',
    iconPath: '/icons/pfd/Decision.svg',
    fileName: 'Decision.svg',
    bg: '#06b6d4',
    text: '#ffffff',
    shadow: 'rgba(6, 182, 212, 0.25)',
  },
  recArea: {
    key: 'recArea',
    label: 'Rec. Area',
    short: 'REC',
    sym: '📥',
    iconPath: '/icons/pfd/Storage.svg',
    fileName: 'Storage.svg',
    bg: '#6366f1',
    text: '#ffffff',
    shadow: 'rgba(99, 102, 241, 0.25)',
  },
};

export function getPfdIconMeta(key: string): PfdIconMeta {
  return PFD_ICON_MAP[key] || PFD_ICON_MAP.oper;
}
