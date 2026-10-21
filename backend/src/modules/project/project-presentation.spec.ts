import { resolveProjectPresentation } from './project-presentation';

describe('resolveProjectPresentation', () => {
  it('resolves standard single base phase without review required', () => {
    const res = resolveProjectPresentation({
      documentTypes: ['Production'],
      creator: { isGuest: false },
    });
    expect(res).toEqual({
      phase: 'Production',
      safeLaunch: false,
      phaseReviewRequired: false,
      guestOrigin: false,
    });
  });

  it('resolves base phase with Safe Launch modifier in any order', () => {
    const res1 = resolveProjectPresentation({
      documentTypes: ['Prototype', 'Safe Launch'],
      creator: { isGuest: false },
    });
    expect(res1).toEqual({
      phase: 'Prototype',
      safeLaunch: true,
      phaseReviewRequired: false,
      guestOrigin: false,
    });

    const res2 = resolveProjectPresentation({
      documentTypes: ['Safe Launch', 'Prototype'],
      creator: { isGuest: false },
    });
    expect(res2).toEqual({
      phase: 'Prototype',
      safeLaunch: true,
      phaseReviewRequired: false,
      guestOrigin: false,
    });
  });

  it('sets phase to null and phaseReviewRequired to true when only document types (like PFMEA) are present', () => {
    const res = resolveProjectPresentation({
      documentTypes: ['PFMEA'],
      creator: { isGuest: false },
    });
    expect(res).toEqual({
      phase: null,
      safeLaunch: false,
      phaseReviewRequired: true,
      guestOrigin: false,
    });
  });

  it('sets phase to null when documentTypes is empty', () => {
    const res = resolveProjectPresentation({
      documentTypes: [],
      creator: { isGuest: false },
    });
    expect(res).toEqual({
      phase: null,
      safeLaunch: false,
      phaseReviewRequired: true,
      guestOrigin: false,
    });
  });

  it('sets phase to null when conflicting base phases are present', () => {
    const res = resolveProjectPresentation({
      documentTypes: ['Prototype', 'Production'],
      creator: { isGuest: false },
    });
    expect(res).toEqual({
      phase: null,
      safeLaunch: false,
      phaseReviewRequired: true,
      guestOrigin: false,
    });
  });

  it('preserves valid base phase but flags phaseReviewRequired if unknown tokens like PFMEA are present', () => {
    const res = resolveProjectPresentation({
      documentTypes: ['PFMEA', 'Pre-Launch'],
      creator: { isGuest: false },
    });
    expect(res).toEqual({
      phase: 'Pre-Launch',
      safeLaunch: false,
      phaseReviewRequired: true,
      guestOrigin: false,
    });
  });

  it('correctly resolves guestOrigin for guest creators while exempting reference projects', () => {
    const guestProj = resolveProjectPresentation({
      name: 'Custom Pump Part 1',
      documentTypes: ['Prototype'],
      creator: { isGuest: true },
    });
    expect(guestProj.guestOrigin).toBe(true);

    const refProj = resolveProjectPresentation({
      id: 'c439cfbe-548a-4e25-a37c-0194652b8526',
      name: 'Reference Demo (E-Vacuum Pump)',
      documentTypes: ['Production'],
      creator: { isGuest: true },
      isDemo: true,
    });
    expect(refProj.guestOrigin).toBe(false);
  });
});
