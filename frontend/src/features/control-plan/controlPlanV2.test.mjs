import test from 'node:test';
import assert from 'node:assert/strict';
import { isCpDocumentV2, getDocLines } from './controlPlanDocument.ts';

test('isCpDocumentV2 accurately distinguishes schema version 1 and 2', () => {
  const v1 = { schemaVersion: 1, config: { phase: 'prototype' }, lines: [] };
  const v2 = { schemaVersion: 2, config: { phase: 'production' }, operations: [] };

  assert.equal(isCpDocumentV2(v1), false);
  assert.equal(isCpDocumentV2(v2), true);
  assert.equal(isCpDocumentV2(null), false);
  assert.equal(isCpDocumentV2(undefined), false);
});

test('getDocLines flattens V2 operations and characteristics into complete tabular rows', () => {
  const v2Doc = {
    schemaVersion: 2,
    config: {
      phase: 'production',
      safeLaunch: { enabled: false },
      standardProfile: 'fmeapex-cp-baseline-v1',
    },
    header: {
      controlPlanNumber: 'CP-V2-001',
    },
    operations: [
      {
        id: 'op-10',
        order: 10,
        number: '10',
        name: 'Milling',
        applicability: 'standard',
        resources: [{ id: 'res-1', kind: 'machine', text: 'CNC-01' }],
        characteristics: [
          {
            id: 'char-1',
            number: '1',
            kind: 'product',
            name: 'Thickness',
            description: 'Wall Thickness',
            classification: 'critical',
            criteria: {
              kind: 'numeric',
              specification: '12.5mm',
              tolerance: '+/- 0.1mm',
              unit: 'mm',
            },
            controls: [
              {
                id: 'ctrl-1',
                controlType: 'detection',
                method: 'Micrometer Check',
                evaluationMethod: 'Digital Micrometer',
                measurementEquipment: 'Micrometer Tool #4',
                executionRule: {
                  mode: 'count',
                  sampleSize: 5,
                  frequency: 'Hourly',
                },
                reaction: {
                  plan: 'Quarantine and notify QC',
                  responsible: 'Operator',
                },
                responsibility: 'Operator',
                recordReference: 'LOG-001',
              },
            ],
          },
        ],
      },
    ],
  };

  const lines = getDocLines(v2Doc);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].operationNumber, '10');
  assert.equal(lines[0].operationName, 'Milling');
  assert.equal(lines[0].equipment, 'CNC-01');
  assert.equal(lines[0].characteristicName, 'Thickness');
  assert.equal(lines[0].specification, '12.5mm');
  assert.equal(lines[0].tolerance, '+/- 0.1mm');
  assert.equal(lines[0].controlMethod, 'Micrometer Check');
  assert.equal(lines[0].reactionPlan, 'Quarantine and notify QC');
});
