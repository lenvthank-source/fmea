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
    bg: '#ffffff',
    text: '#0f172a',
    shadow: 'rgba(15, 23, 42, 0.12)',
  },
  insp: {
    key: 'insp',
    label: 'INSPEC.',
    short: 'INSP',
    sym: '□',
    iconPath: '/icons/pfd/inspect.svg',
    fileName: 'inspect.svg',
    bg: '#ffffff',
    text: '#0f172a',
    shadow: 'rgba(15, 23, 42, 0.12)',
  },
  trans: {
    key: 'trans',
    label: 'TRANS.',
    short: 'TRNS',
    sym: '⇨',
    iconPath: '/icons/pfd/transportation.svg',
    fileName: 'transportation.svg',
    bg: '#ffffff',
    text: '#0f172a',
    shadow: 'rgba(15, 23, 42, 0.12)',
  },
  store: {
    key: 'store',
    label: 'STORE',
    short: 'STR',
    sym: '▽',
    iconPath: '/icons/pfd/Storage.svg',
    fileName: 'Storage.svg',
    bg: '#ffffff',
    text: '#0f172a',
    shadow: 'rgba(15, 23, 42, 0.12)',
  },
  wip: {
    key: 'wip',
    label: 'WIP @ Line',
    short: 'WIP',
    sym: '☉',
    iconPath: '/icons/pfd/WIP.svg',
    fileName: 'WIP.svg',
    bg: '#ffffff',
    text: '#0f172a',
    shadow: 'rgba(15, 23, 42, 0.12)',
  },
  rework: {
    key: 'rework',
    label: 'REWORK',
    short: 'REW',
    sym: 'Ⓡ',
    iconPath: '/icons/pfd/rework.svg',
    fileName: 'rework.svg',
    bg: '#ffffff',
    text: '#0f172a',
    shadow: 'rgba(15, 23, 42, 0.12)',
  },
  reject: {
    key: 'reject',
    label: 'REJECT',
    short: 'REJ',
    sym: '✕',
    iconPath: '/icons/pfd/reject.svg',
    fileName: 'reject.svg',
    bg: '#ffffff',
    text: '#0f172a',
    shadow: 'rgba(15, 23, 42, 0.12)',
  },
  decs: {
    key: 'decs',
    label: 'DECS.',
    short: 'DEC',
    sym: '◇',
    iconPath: '/icons/pfd/Decision.svg',
    fileName: 'Decision.svg',
    bg: '#ffffff',
    text: '#0f172a',
    shadow: 'rgba(15, 23, 42, 0.12)',
  },
  recArea: {
    key: 'recArea',
    label: 'Rec. Area',
    short: 'REC',
    sym: '📥',
    iconPath: '/icons/pfd/Storage.svg',
    fileName: 'Storage.svg',
    bg: '#ffffff',
    text: '#0f172a',
    shadow: 'rgba(15, 23, 42, 0.12)',
  },
};

export function getPfdIconMeta(key: string): PfdIconMeta {
  return PFD_ICON_MAP[key] || PFD_ICON_MAP.oper;
}
