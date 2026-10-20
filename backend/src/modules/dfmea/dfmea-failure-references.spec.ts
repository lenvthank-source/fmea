import { emptyDfmea, validateDfmea, dfmeaReadiness } from './dfmea-document';
import type { DfmeaData } from './dfmea-document';
import {
  acceptFailureReference,
  failureReferenceChanged,
  validateFailureReferences,
} from './dfmea-failure-references';
function fixture(): DfmeaData {
  const d = emptyDfmea();
  d.elements = [
    {
      id: 'system',
      parentId: null,
      kind: 'system',
      name: 'Pump',
      description: '',
    },
    {
      id: 'a',
      parentId: 'system',
      kind: 'component',
      name: 'Seal A',
      description: '',
    },
    {
      id: 'b',
      parentId: 'system',
      kind: 'component',
      name: 'Seal B',
      description: '',
    },
  ];
  d.functions = d.elements.map((e) => ({
    id: 'f-' + e.id,
    elementId: e.id,
    text: 'Retain pressure',
    requirement: 'Spec R',
  }));
  d.chains = d.elements.map((e, i) => ({
    id: 'c-' + e.id,
    focusElementId: e.id,
    functionId: 'f-' + e.id,
    mode: 'Pressure loss ' + e.name,
    effects: [
      {
        id: 'e-' + e.id,
        elementId: 'system',
        text: 'Loss of system pressure',
        severity: 8,
      },
    ],
    causes: Array.from({ length: i === 1 ? 2 : 1 }, (_, n) => ({
      id: 'cause-' + e.id + n,
      elementId: e.id,
      text: 'Design cause ' + n,
      preventionControl: 'Tolerance review',
      detectionControl: 'Design test',
      occurrence: 3 + n,
      detection: 4,
      actions: [],
    })),
    reviewDecision: 'Review recorded',
    specialCharacteristicRefs: [],
  }));
  d.failureReferences = ['a', 'b'].map((e) => ({
    id: 'ref-' + e,
    sourceChainId: 'c-system',
    sourceRole: 'effect',
    sourceFailureId: 'e-system',
    targetChainId: 'c-' + e,
    targetRole: 'effect',
    targetFailureId: 'e-' + e,
    snapshot: {
      text: 'Loss of system pressure',
      severity: 8,
      elementId: 'system',
    },
    reviewedBy: 'Quality Engineer',
    decision: 'Reviewed shared higher-level effect',
  }));
  return d;
}
describe('explicit DFMEA failure relationships', () => {
  it('allows reciprocal analytical contexts when actual snapshot identities do not form a dependency loop', () => {
    const d = fixture();
    d.failureReferences!.push({
      id: 'context-back',
      sourceChainId: 'c-a',
      sourceRole: 'mode',
      sourceFailureId: 'c-a',
      targetChainId: 'c-system',
      targetRole: 'cause',
      targetFailureId: 'cause-system0',
      snapshot: { text: d.chains[1].mode, severity: null, elementId: 'a' },
      reviewedBy: 'Reviewer',
      decision: 'Lower mode represented as higher cause',
    });
    expect(validateFailureReferences(d)).toEqual([]);
  });
  it('shares one higher effect across two focus analyses while preserving multiple cause evaluations', () => {
    const d = fixture();
    expect(validateDfmea(d)).toEqual([]);
    expect(d.chains[1].causes).toHaveLength(2);
    expect(d.failureReferences).toHaveLength(2);
    expect(
      d.failureReferences?.every((ref) => !failureReferenceChanged(d, ref)),
    ).toBe(true);
  });
  it('flags source changes without changing any dependent analysis until individual acceptance', () => {
    const d = fixture();
    d.chains[0].effects[0].severity = 9;
    d.chains[0].effects[0].text = 'Changed source effect';
    expect(
      dfmeaReadiness(d).errors.filter((e) =>
        e.includes('source failure changed'),
      ),
    ).toHaveLength(2);
    expect(d.chains[1].effects[0].severity).toBe(8);
    const accepted = acceptFailureReference(
      d,
      'ref-a',
      'Reviewer',
      'Reviewed changed effect and severity',
    );
    expect(accepted.chains[1].effects[0].severity).toBe(9);
    expect(accepted.chains[1].effects[0].text).toBe('Changed source effect');
    expect(accepted.chains[2].effects[0].severity).toBe(8);
    expect(d.chains[1].effects[0].severity).toBe(8);
    expect(accepted.chains[1].causes).toEqual(d.chains[1].causes);
    expect(
      failureReferenceChanged(accepted, accepted.failureReferences![0]),
    ).toBe(false);
    expect(
      failureReferenceChanged(accepted, accepted.failureReferences![1]),
    ).toBe(true);
  });
  it('rejects dangling identities and circular snapshot dependencies', () => {
    const d = fixture();
    d.failureReferences![0].sourceFailureId = 'missing';
    expect(validateDfmea(d).join()).toContain('endpoint does not exist');
    const cycle = fixture();
    cycle.failureReferences!.push({
      id: 'back',
      sourceChainId: 'c-a',
      sourceRole: 'effect',
      sourceFailureId: 'e-a',
      targetChainId: 'c-system',
      targetRole: 'effect',
      targetFailureId: 'e-system',
      snapshot: {
        text: 'Loss of system pressure',
        severity: 8,
        elementId: 'system',
      },
      reviewedBy: 'Reviewer',
      decision: 'Back reference',
    });
    expect(validateFailureReferences(cycle).join()).toContain('cycle');
  });
  it('does not treat equal narration as a reference or overwrite an independently edited target', () => {
    const d = fixture();
    d.chains[1].effects[0].text = 'Independent target assessment';
    expect(dfmeaReadiness(d).errors.join()).toContain(
      'differs from its accepted snapshot',
    );
    expect(d.chains[1].effects[0].text).toBe('Independent target assessment');
    d.failureReferences = [];
    expect(dfmeaReadiness(d).errors.join()).not.toContain('accepted snapshot');
  });
  it('supports explicit mode-as-cause identity without copying severity or cause ratings', () => {
    const d = fixture();
    d.failureReferences = [
      {
        id: 'mode-ref',
        sourceChainId: 'c-a',
        sourceRole: 'mode',
        sourceFailureId: 'c-a',
        targetChainId: 'c-system',
        targetRole: 'cause',
        targetFailureId: 'cause-system0',
        snapshot: { text: d.chains[1].mode, severity: null, elementId: 'a' },
        reviewedBy: 'Reviewer',
        decision: 'Reviewed mode as cause at higher focus',
      },
    ];
    const before = d.chains[0].causes[0];
    const next = acceptFailureReference(
      d,
      'mode-ref',
      'Reviewer',
      'Accepted contextual cause',
    );
    expect(next.chains[0].causes[0].text).toBe(d.chains[1].mode);
    expect(next.chains[0].causes[0].occurrence).toBe(before.occurrence);
    expect(next.chains[0].effects).toEqual(d.chains[0].effects);
    expect(validateDfmea(next)).toEqual([]);
  });
  it('requires reviewer decision and one explicit source per target record', () => {
    const d = fixture();
    expect(() => acceptFailureReference(d, 'ref-a', '', '')).toThrow(
      'Reviewer',
    );
    d.failureReferences!.push({
      ...d.failureReferences![0],
      id: 'duplicate-target',
    });
    expect(validateDfmea(d).join()).toContain('only one');
  });
  it('compares snapshots by fields rather than JSON property order', () => {
    const d = fixture();
    d.failureReferences![0].snapshot = {
      elementId: 'system',
      severity: 8,
      text: 'Loss of system pressure',
    };
    expect(failureReferenceChanged(d, d.failureReferences![0])).toBe(false);
  });
});
