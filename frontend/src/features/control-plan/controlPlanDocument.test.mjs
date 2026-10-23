import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blankLine,
  importControlRows,
  lineFields,
  validateImport,
  getDocLines,
  applyV1ToV2Conversion,
  emptyCpDocumentV2,
} from './controlPlanDocument.ts';

const documentV2 = () => ({
  schemaVersion: 2,
  config: {
    phase: 'prototype',
    safeLaunch: {
      enabled: false,
      entryCriteria: '',
      exitCriteria: '',
      additionalControls: '',
    },
    standardProfile: 'fmeapex-cp-baseline-v1',
    customerRequirements: '',
    sourceExceptionJustification: '',
  },
  header: {},
  sourceBaselines: [],
  operations: [
    {
      id: 'op-1',
      order: 1,
      number: '10',
      name: 'Cutting',
      resources: [],
      characteristics: [
        {
          id: 'char-1',
          number: '1',
          kind: 'process',
          name: 'Blade Speed',
          classification: '',
          criteria: { kind: 'unspecified', specification: '', tolerance: '' },
          controls: [
            {
              id: 'ctrl-1',
              controlType: 'unspecified',
              method: '',
              evaluationMethod: '',
              executionRule: { mode: 'unspecified' },
              reaction: { trigger: '', plan: '', responsible: '' },
              responsibility: '',
            },
          ],
        },
      ],
    },
  ],
});

test('incomplete engineering drafts are structurally valid without guessed control decisions', () => {
  const draft = documentV2();
  assert.deepEqual(validateImport(draft), []);
  const lines = getDocLines(draft);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].sampleSize, '');
  assert.equal(lines[0].reactionPlan, '');
});

test('edited native worksheets preserve line identity, source provenance and explicit review state', () => {
  const line = blankLine();
  line.id = 'stable-line';
  line.characteristicName = '流量 µm';
  line.source = {
    key: 'source-key',
    revisionId: 'source-revision',
    snapshot: { controlMethod: 'Original' },
  };
  line.sourceState = 'changed';
  const row = {
    ...Object.fromEntries(lineFields.map(([key, label]) => [label, line[key]])),
    'Line ID': line.id,
    'Source provenance': JSON.stringify(line.source),
    'Source review state': line.sourceState,
  };
  const [imported] = importControlRows([
    { ...row, 'Control method': 'Reviewed new method' },
  ]);
  assert.equal(imported.id, line.id);
  assert.deepEqual(imported.source, line.source);
  assert.equal(imported.sourceState, 'changed');
  assert.equal(imported.controlMethod, 'Reviewed new method');
  assert.equal(imported.characteristicName, '流量 µm');
});

test('imports report duplicate identity and invalid baseline rather than repairing them', () => {
  const draft = documentV2();
  draft.operations.push({ ...draft.operations[0] });
  draft.sourceBaselines = [{ revisionId: '', type: 'DFMEA' }];
  const errors = validateImport(draft);
  assert.ok(errors.some((error) => error.includes('duplicate identity')));
  assert.ok(errors.some((error) => error.includes('Source baseline')));
});

test('exclusions require review justification and retain exact source fingerprint', () => {
  const draft = documentV2();
  draft.sourceExclusions = [
    {
      key: 'key',
      revisionId: 'revision',
      reason: ' ',
      sourceFingerprint: 'fingerprint',
    },
  ];
  assert.ok(
    validateImport(draft).some((error) => error.includes('Source exclusion')),
  );
  draft.sourceExclusions[0].reason =
    'Not applicable to this controlled product family';
  assert.deepEqual(validateImport(draft), []);
});

test('applyV1ToV2Conversion converts V1 legacy lines into structured V2 operations and characteristics', () => {
  const v1Doc = {
    schemaVersion: 1,
    config: {
      phase: 'prototype',
      safeLaunch: { enabled: false, entryCriteria: '', exitCriteria: '', additionalControls: '' },
      standardProfile: 'custom',
      customerRequirements: 'CR-101',
      sourceExceptionJustification: '',
    },
    header: { partNumber: 'PN-99' },
    sourceBaselines: [{ revisionId: 'rev-pfd', type: 'PFD' }],
    lines: [
      {
        id: 'line-1',
        operationId: 'op-10',
        operationNumber: '10',
        operationName: 'Turning',
        equipment: 'Lathe L-1',
        characteristicId: 'char-1',
        characteristicNumber: '1.1',
        characteristicName: 'Outer Diameter',
        characteristicKind: 'product',
        classification: 'critical',
        specification: '25mm',
        tolerance: '+/- 0.05mm',
        controlMethod: 'Visual & Caliper',
        controlType: 'detection',
        evaluationMethod: 'Digital Caliper',
        sampleSize: '5 pcs',
        frequency: 'Every hour',
        volumeBasis: 'Hourly',
        reactionPlan: 'Hold batch and adjust tooling',
        responsible: 'Machinist',
      },
    ],
  };

  const v2 = applyV1ToV2Conversion(v1Doc);
  assert.equal(v2.schemaVersion, 2);
  assert.equal(v2.operations.length, 1);
  assert.equal(v2.operations[0].number, '10');
  assert.equal(v2.operations[0].resources[0].text, 'Lathe L-1');
  assert.equal(v2.operations[0].characteristics[0].name, 'Outer Diameter');
  assert.equal(v2.operations[0].characteristics[0].controls[0].method, 'Visual & Caliper');
  assert.deepEqual(validateImport(v2), []);
});

test('all rows are retained when importing more than a page of controls', () => {
  const rows = Array.from({ length: 125 }, (_, index) => ({
    ...Object.fromEntries(lineFields.map(([key, label]) => [label, blankLine()[key]])),
    'Line ID': `line-${index}`,
  }));
  const imported = importControlRows(rows);
  assert.equal(imported.length, 125);
  assert.equal(imported.at(-1).id, 'line-124');
});
