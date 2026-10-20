import { emptyDfmea } from './dfmea-document';
import type { DfmeaData, DesignAction } from './dfmea-document';
import { dfmeaActionChanges } from './dfmea-action-policy';
const reviewer = {
  id: 'reviewer',
  name: 'Quality Engineer',
  email: 'quality@example.test',
};
const action = (status: DesignAction['status']): DesignAction => ({
  id: 'action',
  type: 'prevention',
  description: 'Validate design',
  owner: 'Design Engineer',
  targetDate: '2026-10-20',
  status,
  taken: 'Report R1',
  completionDate: '2026-10-20',
  evidence: 'R1',
  decision: 'Effective',
  revisedOccurrence: status === 'verified' ? 2 : null,
  revisedDetection: status === 'verified' ? 4 : null,
});
function model(status: DesignAction['status']): DfmeaData {
  const data = emptyDfmea();
  data.chains = [
    {
      id: 'chain',
      focusElementId: 'e',
      functionId: 'f',
      mode: 'Failure',
      effects: [],
      causes: [
        {
          id: 'cause',
          elementId: null,
          text: 'Cause',
          preventionControl: '',
          detectionControl: '',
          occurrence: 5,
          detection: 5,
          actions: [action(status)],
        },
      ],
      reviewDecision: '',
      specialCharacteristicRefs: [],
    },
  ];
  return data;
}
describe('DFMEA evidence lifecycle', () => {
  it('requires a complete explicitly justified O/D pair when verifying reassessment, while permitting no recorded reassessment', () => {
    const next = model('verified');
    next.chains[0].causes[0].actions[0].revisedDetection = null;
    expect(
      dfmeaActionChanges(model('completed'), next, reviewer).join(),
    ).toContain('complete O and D pair');
    next.chains[0].causes[0].actions[0].revisedOccurrence = null;
    expect(dfmeaActionChanges(model('completed'), next, reviewer)).toEqual([]);
  });
  it('preserves unchanged historical partial reassessment evidence without fabricating missing ratings', () => {
    const historical = model('verified');
    historical.chains[0].causes[0].actions[0].revisedDetection = null;
    expect(
      dfmeaActionChanges(historical, structuredClone(historical), reviewer),
    ).toEqual([]);
  });
  it('requires new and imported actions to start open', () => {
    expect(
      dfmeaActionChanges(null, model('verified'), reviewer).join(),
    ).toContain('start open');
    expect(dfmeaActionChanges(null, model('open'), reviewer)).toEqual([]);
  });
  it('allows one reviewed transition at a time', () => {
    expect(
      dfmeaActionChanges(model('open'), model('completed'), reviewer).join(),
    ).toContain('in order');
    expect(
      dfmeaActionChanges(model('open'), model('in_progress'), reviewer),
    ).toEqual([]);
  });
  it('protects verified evidence against deleting its whole parent analysis', () => {
    expect(
      dfmeaActionChanges(model('verified'), emptyDfmea(), reviewer).join(),
    ).toContain('cannot be removed');
  });
  it('protects verified evidence against changing the saved record', () => {
    const changed = model('verified');
    changed.chains[0].causes[0].actions[0].evidence = 'Different report';
    expect(
      dfmeaActionChanges(model('verified'), changed, reviewer).join(),
    ).toContain('protected');
    expect(
      dfmeaActionChanges(model('verified'), model('verified'), reviewer),
    ).toEqual([]);
  });
  it('requires independent effectiveness reviewer and compares normalized identity', () => {
    const next = model('verified');
    next.chains[0].causes[0].actions[0].owner = '  QUALITY@EXAMPLE.TEST  ';
    expect(
      dfmeaActionChanges(model('completed'), next, reviewer).join(),
    ).toContain('independently');
    expect(
      dfmeaActionChanges(model('completed'), model('verified'), reviewer),
    ).toEqual([]);
  });
});
