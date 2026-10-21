export type ProjectPhaseBase = 'Prototype' | 'Pre-Launch' | 'Production';

export interface ProjectPresentation {
  phase: ProjectPhaseBase | null;
  safeLaunch: boolean;
  phaseReviewRequired: boolean;
  guestOrigin: boolean | null;
}

const RECOGNIZED_PHASE_BASES: readonly ProjectPhaseBase[] = [
  'Prototype',
  'Pre-Launch',
  'Production',
];

const REFERENCE_DEMO_PROJECT_ID = 'c439cfbe-548a-4e25-a37c-0194652b8526';

export function resolveProjectPresentation(project: {
  id?: string;
  name?: string | null;
  documentTypes?: string[] | null;
  isDemo?: boolean | null;
  creator?: { isGuest?: boolean | null } | null;
  uiSettings?: any;
}): ProjectPresentation {
  const docTypes = Array.isArray(project.documentTypes) ? project.documentTypes : [];

  // Check for Safe Launch modifier
  const safeLaunch = docTypes.some(
    (t) => typeof t === 'string' && t.trim().toLowerCase() === 'safe launch',
  );

  // Collect distinct recognized base phases
  const recognizedBases = Array.from(
    new Set(
      docTypes
        .map((t) => typeof t === 'string' ? t.trim() : '')
        .filter((t): t is ProjectPhaseBase =>
          (RECOGNIZED_PHASE_BASES as readonly string[]).includes(t),
        ),
    ),
  );

  let phase: ProjectPhaseBase | null = null;
  if (recognizedBases.length === 1) {
    phase = recognizedBases[0];
  }

  // Detect any unrecognized tokens (e.g. document types like PFMEA, PFD, DFMEA, CONTROL_PLAN, etc.)
  const hasUnknownTokens = docTypes.some((t) => {
    if (typeof t !== 'string') return true;
    const trimmed = t.trim();
    if (!trimmed) return true;
    if (trimmed.toLowerCase() === 'safe launch') return false;
    return !(RECOGNIZED_PHASE_BASES as readonly string[]).includes(trimmed);
  });

  const phaseReviewRequired = phase === null || hasUnknownTokens;

  // Resolve guest origin
  const isReference =
    project.isDemo === true ||
    project.id === REFERENCE_DEMO_PROJECT_ID ||
    (typeof project.name === 'string' &&
      project.name.toLowerCase().includes('reference demo'));

  let guestOrigin: boolean | null = false;
  if (isReference) {
    guestOrigin = false;
  } else if (project.creator && typeof project.creator.isGuest === 'boolean') {
    guestOrigin = project.creator.isGuest;
  } else if (project.uiSettings?.isGuestProject === true) {
    guestOrigin = true;
  } else if (project.creator === null || project.creator === undefined) {
    guestOrigin = project.uiSettings?.isGuestProject ? true : null;
  }

  return {
    phase,
    safeLaunch,
    phaseReviewRequired,
    guestOrigin,
  };
}
