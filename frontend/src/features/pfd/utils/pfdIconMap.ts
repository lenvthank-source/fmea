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
    bg: '#334155',
    text: '#ffffff',
    shadow: 'rgba(51, 65, 85, 0.25)',
  },
  insp: {
    key: 'insp',
    label: 'INSPEC.',
    short: 'INSP',
    sym: '□',
    iconPath: '/icons/pfd/inspect.svg',
    fileName: 'inspect.svg',
    bg: '#334155',
    text: '#ffffff',
    shadow: 'rgba(51, 65, 85, 0.25)',
  },
  trans: {
    key: 'trans',
    label: 'TRANS.',
    short: 'TRNS',
    sym: '⇨',
    iconPath: '/icons/pfd/transportation.svg',
    fileName: 'transportation.svg',
    bg: '#334155',
    text: '#ffffff',
    shadow: 'rgba(51, 65, 85, 0.25)',
  },
  store: {
    key: 'store',
    label: 'STORE',
    short: 'STR',
    sym: '▽',
    iconPath: '/icons/pfd/Storage.svg',
    fileName: 'Storage.svg',
    bg: '#334155',
    text: '#ffffff',
    shadow: 'rgba(51, 65, 85, 0.25)',
  },
  wip: {
    key: 'wip',
    label: 'WIP @ Line',
    short: 'WIP',
    sym: '☉',
    iconPath: '/icons/pfd/WIP.svg',
    fileName: 'WIP.svg',
    bg: '#334155',
    text: '#ffffff',
    shadow: 'rgba(51, 65, 85, 0.25)',
  },
  rework: {
    key: 'rework',
    label: 'REWORK',
    short: 'REW',
    sym: 'Ⓡ',
    iconPath: '/icons/pfd/rework.svg',
    fileName: 'rework.svg',
    bg: '#334155',
    text: '#ffffff',
    shadow: 'rgba(51, 65, 85, 0.25)',
  },
  reject: {
    key: 'reject',
    label: 'REJECT',
    short: 'REJ',
    sym: '✕',
    iconPath: '/icons/pfd/reject.svg',
    fileName: 'reject.svg',
    bg: '#334155',
    text: '#ffffff',
    shadow: 'rgba(51, 65, 85, 0.25)',
  },
  decs: {
    key: 'decs',
    label: 'DECS.',
    short: 'DEC',
    sym: '◇',
    iconPath: '/icons/pfd/Decision.svg',
    fileName: 'Decision.svg',
    bg: '#334155',
    text: '#ffffff',
    shadow: 'rgba(51, 65, 85, 0.25)',
  },
  recArea: {
    key: 'recArea',
    label: 'Rec. Area',
    short: 'REC',
    sym: '📥',
    iconPath: '/icons/pfd/Storage.svg',
    fileName: 'Storage.svg',
    bg: '#334155',
    text: '#ffffff',
    shadow: 'rgba(51, 65, 85, 0.25)',
  },
};

export function getPfdIconMeta(key: string): PfdIconMeta {
  return PFD_ICON_MAP[key] || PFD_ICON_MAP.oper;
}
