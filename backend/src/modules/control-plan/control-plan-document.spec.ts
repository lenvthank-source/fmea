import {
  blankCpLine,
  emptyCpDocument,
  validateCpDocument,
  previewCp,
  applyCpChanges,
  controlPlanReadiness,
  sourceFields,
  normalizeCpDocument,
} from './control-plan-document';
function candidate() {
  const l = blankCpLine('generated');
  l.operationId = 'op';
  l.operationName = 'Press';
  l.controlMethod = 'Monitor';
  l.source = {
    key: 'stable',
    revisionId: 'source',
    snapshot: Object.fromEntries(sourceFields.map((k) => [k, l[k]])),
  };
  return l;
}
describe('control-plan document', () => {
  it('allows incomplete drafts but rejects release', () => {
    const d = emptyCpDocument();
    expect(() => validateCpDocument(d)).not.toThrow();
    expect(controlPlanReadiness(d).ready).toBe(false);
  });
  it('rejects duplicate lines', () => {
    const d = emptyCpDocument();
    d.lines = [blankCpLine('a'), blankCpLine('a')];
    expect(() => validateCpDocument(d)).toThrow();
  });
  it('never invents methods sampling or reaction', () => {
    const c = previewCp(emptyCpDocument(), [candidate()], 'source')[0];
    expect(c.kind).toBe('add');
    expect(c.candidate.sampleSize).toBe('');
    expect(c.candidate.reactionPlan).toBe('');
  });
  it('applies explicit additions idempotently', () => {
    const d = emptyCpDocument(),
      c = candidate();
    const result = applyCpChanges(d, previewCp(d, [c], 'source'), [
      { key: 'stable', action: 'add' },
    ]);
    expect(result.lines).toHaveLength(1);
    expect(previewCp(result, [c], 'source')).toEqual([]);
    expect(d.lines).toHaveLength(0);
  });
  it('preserves refined fields and execution details', () => {
    const d = emptyCpDocument(),
      old = candidate();
    old.operationName = 'Reviewed custom';
    old.frequency = 'Every unit';
    old.reactionPlan = 'Q7';
    d.lines = [old];
    const next = candidate();
    next.operationName = 'New';
    next.source!.snapshot.operationName = 'New';
    const changes = previewCp(d, [next], 'source');
    expect(changes[0].conflicts).toContain('operationName');
    const result = applyCpChanges(d, changes, [
      {
        key: 'stable',
        action: 'update',
        resolutions: { operationName: 'current' },
      },
    ]);
    expect(result.lines[0].operationName).toBe('Reviewed custom');
    expect(result.lines[0].frequency).toBe('Every unit');
    expect(result.lines[0].reactionPlan).toBe('Q7');
    expect(result.lines[0].sourceState).toBe('current');
  });
  it('updates unrefined source fields', () => {
    const d = emptyCpDocument();
    d.lines = [candidate()];
    const next = candidate();
    next.operationName = 'New';
    next.source!.snapshot.operationName = 'New';
    expect(
      applyCpChanges(d, previewCp(d, [next], 'source'), [
        { key: 'stable', action: 'update' },
      ]).lines[0].operationName,
    ).toBe('New');
  });
  it('keeps removed sources until explicit detach without deletion', () => {
    const d = emptyCpDocument();
    d.lines = [candidate()];
    const changes = previewCp(d, [], 'source');
    expect(changes[0].kind).toBe('remove');
    expect(applyCpChanges(d, changes, []).lines).toHaveLength(1);
    expect(
      applyCpChanges(d, changes, [{ key: 'stable', action: 'detach' }]).lines[0]
        .source,
    ).toBeUndefined();
  });
  it('rejects malformed unknown duplicate or incompatible decisions', () => {
    const d = emptyCpDocument(),
      changes = previewCp(d, [candidate()], 'source');
    expect(() =>
      applyCpChanges(d, changes, [{ key: 'bad', action: 'add' }]),
    ).toThrow();
    expect(() =>
      applyCpChanges(d, changes, [{ key: 'stable', action: 'detach' }]),
    ).toThrow();
    expect(() =>
      applyCpChanges(d, changes, [
        { key: 'stable', action: 'keep' },
        { key: 'stable', action: 'add' },
      ]),
    ).toThrow();
  });
  it('requires defined safe-launch criteria', () => {
    const d = emptyCpDocument();
    d.config.safeLaunch.enabled = true;
    expect(
      controlPlanReadiness(d).errors.some((e) => e.includes('Safe launch')),
    ).toBe(true);
  });
});

describe('reviewed control-plan source governance', () => {
  it('requires explicit conflict choices', () => {
    const d = emptyCpDocument(),
      old = candidate();
    old.operationName = 'Custom';
    d.lines = [old];
    const c = candidate();
    c.operationName = 'New';
    c.source!.snapshot.operationName = 'New';
    expect(() =>
      applyCpChanges(d, previewCp(d, [c], 'source'), [
        { key: 'stable', action: 'update' },
      ]),
    ).toThrow('explicitly');
    const result = applyCpChanges(d, previewCp(d, [c], 'source'), [
      {
        key: 'stable',
        action: 'update',
        resolutions: { operationName: 'source' },
      },
    ]);
    expect(result.lines[0].operationName).toBe('New');
  });
  it('remembers reasoned exclusions only while source is unchanged', () => {
    const d = emptyCpDocument(),
      c = candidate(),
      changes = previewCp(d, [c], 'source');
    expect(() =>
      applyCpChanges(d, changes, [{ key: 'stable', action: 'exclude' }]),
    ).toThrow('rationale');
    const result = applyCpChanges(d, changes, [
      {
        key: 'stable',
        action: 'exclude',
        reason: 'Alternative requirement covers this candidate',
      },
    ]);
    expect(result.lines).toHaveLength(0);
    expect(previewCp(result, [c], 'source')).toHaveLength(0);
    c.controlMethod = 'New control';
    c.source!.snapshot.controlMethod = 'New control';
    expect(previewCp(result, [c], 'source')[0].kind).toBe('add');
  });
  it('rejects invalid source state and duplicate exclusions', () => {
    const d = emptyCpDocument();
    d.lines = [{ ...candidate(), sourceState: 'approved' as never }];
    expect(() => validateCpDocument(d)).toThrow('state');
    d.lines = [];
    d.sourceExclusions = [
      { key: 'x', revisionId: 'r', reason: 'reviewed', sourceFingerprint: 'f' },
      { key: 'x', revisionId: 'r', reason: 'reviewed', sourceFingerprint: 'f' },
    ];
    expect(() => validateCpDocument(d)).toThrow('exclusion');
  });
  it('normalizes older v1 drafts without guessing engineering content', () => {
    const d = emptyCpDocument(),
      l = candidate();
    delete (l as Partial<typeof l>).volumeBasis;
    delete (l as Partial<typeof l>).reactionOwner;
    d.lines = [l];
    const result = normalizeCpDocument(d);
    expect(result.lines[0].volumeBasis).toBe('');
    expect(result.lines[0].reactionOwner).toBe('');
    expect(d.lines[0].volumeBasis).toBeUndefined();
  });
  it('reports verified general-data header gaps and does not require unique part for common plans', () => {
    const d = emptyCpDocument({
      controlPlanNumber: 'CP-1',
      issueDate: '2026-10-19',
      customer: 'Customer',
      organisationName: 'Organisation',
      organisationPlant: 'Plant',
      partName: 'Family',
      engineeringChangeLevel: 'A',
      keyContact: 'Quality',
      commonPlanDesignation: 'FAMILY-1',
    });
    expect(
      controlPlanReadiness(d).errors.filter((e) => e.startsWith('Header')),
    ).toEqual([]);
    d.header.issueDate = '';
    expect(
      controlPlanReadiness(d).errors.some((e) => e.includes('issueDate')),
    ).toBe(true);
  });
  it('does not accept whitespace sampling as complete', () => {
    const d = emptyCpDocument();
    const l = candidate();
    l.sampleSize = ' ';
    l.frequency = ' ';
    l.volumeBasis = ' ';
    d.lines = [l];
    expect(
      controlPlanReadiness(d).errors.some((e) => e.includes('sampling')),
    ).toBe(true);
  });
});
