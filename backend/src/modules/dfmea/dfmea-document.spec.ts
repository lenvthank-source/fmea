import {
  emptyDfmea,
  validateDfmea,
  dfmeaReadiness,
  dfmeaEvaluations,
  DfmeaData,
} from './dfmea-document';
export function designFixture(): DfmeaData {
  const d = emptyDfmea();
  d.planning = {
    scope: 'Pump system',
    boundary: 'Housing and interfaces',
    team: 'Design and quality',
    timing: 'Design gate',
    criteriaProfile: 'AIAG/VDA; configured profile unverified',
  };
  d.elements = [
    {
      id: 'system',
      parentId: null,
      kind: 'system',
      name: 'Pump',
      description: '',
    },
    {
      id: 'component',
      parentId: 'system',
      kind: 'component',
      name: 'Seal',
      description: '',
    },
  ];
  d.functions = [
    {
      id: 'f',
      elementId: 'component',
      text: 'Retain pressure',
      requirement: 'Actual specification reference R1',
    },
  ];
  d.chains = [
    {
      id: 'chain',
      focusElementId: 'component',
      functionId: 'f',
      mode: 'Loss of sealing',
      effects: [
        {
          id: 'effect',
          elementId: 'system',
          text: 'Loss of pressure',
          severity: 8,
        },
      ],
      causes: [
        {
          id: 'cause',
          elementId: 'component',
          text: 'Seal dimension unsuitable',
          preventionControl: 'Tolerance analysis',
          detectionControl: 'Design validation',
          occurrence: 4,
          detection: 5,
          actions: [],
        },
      ],
      reviewDecision: 'Team decision recorded',
      specialCharacteristicRefs: [],
    },
  ];
  return d;
}
describe('canonical design model', () => {
  it('never combines sequential O-only and D-only historical action assessments or fills from baseline', () => {
    const d = designFixture();
    const cause = d.chains[0].causes[0];
    const base = {
      type: 'prevention' as const,
      description: 'Validated design',
      owner: 'Engineer',
      targetDate: '2026-10-20',
      status: 'verified' as const,
      taken: 'Test completed',
      completionDate: '2026-10-20',
      evidence: 'Test report',
      decision: 'Effectiveness reviewed',
    };
    cause.actions = [
      { ...base, id: 'only-o', revisedOccurrence: 2, revisedDetection: null },
      { ...base, id: 'only-d', revisedOccurrence: null, revisedDetection: 1 },
    ];
    const partial = dfmeaEvaluations(d)[0];
    expect(partial.revisedAp).toBeNull();
    expect(partial.revisedOccurrence).toBeNull();
    expect(partial.revisedDetection).toBeNull();
    expect(partial.reassessmentState).toBe('unreviewed-partial');
    expect(dfmeaReadiness(d).errors.join()).toContain('historical/partial');
    cause.actions.push({
      ...base,
      id: 'complete',
      revisedOccurrence: 3,
      revisedDetection: 4,
    });
    const complete = dfmeaEvaluations(d)[0];
    expect(complete.reassessmentActionId).toBe('complete');
    expect(complete.revisedOccurrence).toBe(3);
    expect(complete.revisedDetection).toBe(4);
    expect(complete.revisedAp).not.toBeNull();
    expect(complete.unreviewedPartialActionIds).toEqual(['only-o', 'only-d']);
    expect(cause.occurrence).toBe(4);
    expect(cause.detection).toBe(5);
  });
  it('keeps reassessment visibly unassessed when verified effectiveness records no reassessed ratings', () => {
    const d = designFixture();
    d.chains[0].causes[0].actions = [
      {
        id: 'no-reassessment',
        type: 'detection',
        description: 'Confirm test method',
        owner: 'Engineer',
        targetDate: '2026-10-20',
        status: 'verified',
        taken: 'Completed',
        completionDate: '2026-10-20',
        evidence: 'Report',
        decision: 'No numerical reassessment recorded',
        revisedOccurrence: null,
        revisedDetection: null,
      },
    ];
    expect(dfmeaEvaluations(d)[0].reassessmentState).toBe('unassessed');
    expect(dfmeaEvaluations(d)[0].revisedAp).toBeNull();
  });
  it('requires an explicit reason to exclude a context element without hiding actual authored analysis', () => {
    const d = designFixture();
    expect(dfmeaReadiness(d).errors.join()).toContain('Pump: add a function');
    d.scopeExclusions = [{ elementId: 'system', reason: '' }];
    expect(validateDfmea(d)).toEqual([]);
    expect(dfmeaReadiness(d).errors.join()).toContain(
      'exclusion requires a documented reason',
    );
    d.scopeExclusions[0].reason =
      'External assembly function is owned by the customer; boundary context retained';
    expect(dfmeaReadiness(d).ready).toBe(true);
    d.scopeExclusions.push({ elementId: 'component', reason: 'Context only' });
    d.functions[0].requirement = '';
    expect(dfmeaReadiness(d).errors.join()).toContain(
      'measurable requirements',
    );
  });
  it('rejects duplicate or nonexistent exclusion references', () => {
    const d = designFixture();
    d.scopeExclusions = [{ elementId: 'absent', reason: 'External' }];
    expect(validateDfmea(d).join()).toContain('element does not exist');
    d.scopeExclusions = [
      { elementId: 'system', reason: 'External' },
      { elementId: 'system', reason: 'External' },
    ];
    expect(validateDfmea(d).join()).toContain('must be unique');
  });
  it('permits incomplete drafts without pretending release readiness', () => {
    expect(validateDfmea(emptyDfmea())).toEqual([]);
    expect(dfmeaReadiness(emptyDfmea()).ready).toBe(false);
  });
  it('rejects cyclic and dangling hierarchy', () => {
    const d = designFixture();
    d.elements[0].parentId = 'component';
    expect(validateDfmea(d).join()).toContain('cycles');
    d.elements[0].parentId = 'absent';
    expect(validateDfmea(d).join()).toContain('parent does not exist');
  });
  it('requires focus function identity, not matching narration', () => {
    const d = designFixture();
    d.chains[0].focusElementId = 'system';
    expect(validateDfmea(d).join()).toContain('focus element');
  });
  it('does not truncate fractional ratings or accept client AP', () => {
    const d = designFixture();
    d.chains[0].causes[0].occurrence = 4.5;
    expect(validateDfmea(d).join()).toContain('integer');
    (d.chains[0] as any).ap = 'L';
    expect(validateDfmea(d).join()).toContain('unknown field ap');
  });
  it('computes cause evaluations, preserving severity across detection improvements', () => {
    const d = designFixture();
    const before = dfmeaEvaluations(d)[0];
    d.chains[0].causes[0].detection = 1;
    expect(dfmeaEvaluations(d)[0].severity).toBe(before.severity);
    expect(before.profile).toBe('legacy-configured-unverified');
    d.chains[0].effects[0].severity = null;
    expect(dfmeaEvaluations(d)[0].ap).toBeNull();
  });
  it('requires evidence and effectiveness before reassessment', () => {
    const d = designFixture();
    d.chains[0].causes[0].actions = [
      {
        id: 'a',
        type: 'detection',
        description: 'Validate',
        owner: 'Engineer',
        targetDate: '2026-10-20',
        status: 'completed',
        taken: '',
        completionDate: '',
        evidence: '',
        decision: '',
        revisedOccurrence: null,
        revisedDetection: 2,
      },
    ];
    expect(validateDfmea(d).join()).toContain('verified action');
    d.chains[0].causes[0].actions[0].status = 'verified';
    expect(validateDfmea(d).join()).toContain('effectiveness');
  });
  it('handles analysis beyond legacy page limits', () => {
    const d = designFixture();
    d.chains = Array.from({ length: 101 }, (_, i) => ({
      ...structuredClone(d.chains[0]),
      id: `chain${i}`,
      effects: [{ ...d.chains[0].effects[0], id: `effect${i}` }],
      causes: [{ ...d.chains[0].causes[0], id: `cause${i}` }],
    }));
    expect(validateDfmea(d)).toEqual([]);
    expect(dfmeaEvaluations(d)).toHaveLength(101);
  });
  it('rejects impossible calendar dates instead of normalizing imported evidence dates', () => {
    const d = designFixture();
    d.chains[0].causes[0].actions = [
      {
        id: 'a',
        type: 'prevention',
        description: 'Validate geometry',
        owner: 'Engineer',
        targetDate: '2026-02-30',
        status: 'open',
        taken: '',
        completionDate: '',
        evidence: '',
        decision: '',
        revisedOccurrence: null,
        revisedDetection: null,
      },
    ];
    expect(validateDfmea(d).join()).toContain('ISO date');
    d.chains[0].causes[0].actions[0].targetDate = '2028-02-29';
    expect(validateDfmea(d)).toEqual([]);
  });
  it('allows drafting an unassigned action but identifies its exact analysis before submission', () => {
    const d = designFixture();
    d.chains[0].causes[0].actions = [
      {
        id: 'unassigned',
        type: 'prevention',
        description: '',
        owner: '',
        targetDate: '',
        status: 'open',
        taken: '',
        completionDate: '',
        evidence: '',
        decision: '',
        revisedOccurrence: null,
        revisedDetection: null,
      },
    ];
    expect(validateDfmea(d)).toEqual([]);
    expect(dfmeaReadiness(d).errors.join()).toContain(
      'Loss of sealing: action unassigned',
    );
  });
  it('keeps completed actions separate from verified effectiveness', () => {
    const d = designFixture();
    d.chains[0].causes[0].actions = [
      {
        id: 'completed',
        type: 'detection',
        description: 'Test design',
        owner: 'Engineer',
        targetDate: '2026-10-20',
        status: 'completed',
        taken: '',
        completionDate: '',
        evidence: '',
        decision: '',
        revisedOccurrence: null,
        revisedDetection: null,
      },
    ];
    expect(dfmeaReadiness(d).errors.join()).toContain(
      'completed action completed needs results',
    );
    expect(dfmeaEvaluations(d)[0].revisedAp).toBeNull();
  });
  it('does not accept a reviewed characteristic label without its actual classification source and reviewer', () => {
    const d = designFixture();
    d.chains[0].specialCharacteristicRefs = [
      {
        id: 'char',
        characteristic: 'Seal diameter',
        classification: '',
        source: '',
        reviewedBy: '',
      },
    ];
    expect(dfmeaReadiness(d).errors.join()).toContain(
      'customer classification, source and reviewer',
    );
  });
  it('does not crash completeness checks on malformed imported shapes', () => {
    expect(() =>
      dfmeaReadiness({
        schemaVersion: 1,
        elements: null,
      } as unknown as DfmeaData),
    ).not.toThrow();
    expect(
      dfmeaReadiness({
        schemaVersion: 1,
        elements: null,
      } as unknown as DfmeaData).ready,
    ).toBe(false);
  });
});
