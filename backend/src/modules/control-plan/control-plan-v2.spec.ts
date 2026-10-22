import {
  emptyCpDocument,
  emptyCpDocumentV2,
  previewV1ToV2Conversion,
  applyV1ToV2Conversion,
  validateCpDocumentV2,
  controlPlanReadiness,
  blankCpLine,
  CpDocumentV1,
} from './control-plan-document';
import {
  BASELINE_CP_PROFILE_CONTENT,
  computeProfileHash,
} from './cp-profile-baseline';

describe('Control Plan V2 Conversion & Validation', () => {
  it('losslessly converts a v1 document to v2 with exact line attribution', () => {
    const v1 = emptyCpDocument({
      controlPlanNumber: 'CP-100',
      issueDate: '2026-10-23',
      customer: 'OEM Corp',
      organisationName: 'Apex Mfg',
      organisationPlant: 'Plant 1',
      partName: 'Drive Shaft',
      engineeringChangeLevel: 'Rev C',
      keyContact: 'Chief Engineer',
      commonPlanDesignation: 'DS-FAMILY',
    });
    v1.config.phase = 'production';
    v1.sourceBaselines = [
      { revisionId: 'rev-pfd-1', type: 'PFD' },
      { revisionId: 'rev-pfmea-1', type: 'PFMEA' },
    ];

    const l1 = blankCpLine('line-1');
    l1.operationId = 'op-10';
    l1.operationNumber = '10';
    l1.operationName = 'CNC Turning';
    l1.equipment = 'Lathe #4';
    l1.characteristicId = 'char-101';
    l1.characteristicNumber = '1.1';
    l1.characteristicName = 'Outer Diameter';
    l1.characteristicKind = 'product';
    l1.classification = 'Critical (CC)';
    l1.unit = 'mm';
    l1.specification = '50.0';
    l1.tolerance = '+/- 0.05';
    l1.controlMethod = 'Micrometer check';
    l1.controlType = 'detection';
    l1.evaluationMethod = 'Digital Micrometer';
    l1.gauge = 'MIC-01';
    l1.sampleSize = '5 pcs';
    l1.frequency = '1 / hour';
    l1.volumeBasis = 'production lot';
    l1.reactionPlan = 'Quarantine last hour of production';
    l1.responsible = 'Operator';
    l1.reactionOwner = 'Quality Lead';
    l1.source = {
      key: 'pfmea-row-1',
      revisionId: 'rev-pfmea-1',
      pfmeaRowId: 'pfmea-row-1',
      snapshot: {
        operationName: 'CNC Turning',
        specification: '50.0',
      },
    };

    const l2 = blankCpLine('line-2');
    l2.operationId = 'op-10';
    l2.operationNumber = '10';
    l2.operationName = 'CNC Turning';
    l2.equipment = 'Lathe #4';
    l2.characteristicId = 'char-102';
    l2.characteristicNumber = '1.2';
    l2.characteristicName = 'Surface Roughness';
    l2.characteristicKind = 'product';
    l2.specification = 'Ra 0.8';
    l2.tolerance = 'max';
    l2.controlMethod = 'Profilometer';
    l2.controlType = 'detection';
    l2.evaluationMethod = 'Stylus sweep';
    l2.gauge = 'PROF-02';
    l2.sampleSize = '1 pc';
    l2.frequency = '1 / shift';
    l2.volumeBasis = 'shift';
    l2.reactionPlan = 'Stop spindle, replace insert';
    l2.responsible = 'Quality Inspector';

    v1.lines = [l1, l2];

    const { v2, previewHash, warnings } = previewV1ToV2Conversion(v1);

    expect(warnings.length).toBeGreaterThan(0);
    expect(previewHash).toHaveLength(64);
    expect(v2.schemaVersion).toBe(2);
    expect(v2.operations).toHaveLength(1);

    const op = v2.operations[0];
    expect(op.id).toBe('op-10');
    expect(op.number).toBe('10');
    expect(op.name).toBe('CNC Turning');
    expect(op.resources).toHaveLength(1);
    expect(op.resources[0].text).toBe('Lathe #4');
    expect(op.characteristics).toHaveLength(2);

    const char1 = op.characteristics[0];
    expect(char1.id).toBe('char-101');
    expect(char1.name).toBe('Outer Diameter');
    expect(char1.classification).toBe('Critical (CC)');
    expect(char1.criteria.specification).toBe('50.0');
    expect(char1.criteria.tolerance).toBe('+/- 0.05');
    expect(char1.controls).toHaveLength(1);

    const ctrl1 = char1.controls[0];
    expect(ctrl1.id).toBe('line-1');
    expect(ctrl1.method).toBe('Micrometer check');
    expect(ctrl1.measurementEquipment).toBe('MIC-01');
    expect(ctrl1.executionRule.mode).toBe('unspecified');
    expect(ctrl1.executionRule.legacySampleSize).toBe('5 pcs');
    expect(ctrl1.executionRule.legacyFrequency).toBe('1 / hour');
    expect(ctrl1.reaction.plan).toBe('Quarantine last hour of production');
    expect(ctrl1.reaction.responsible).toBe('Quality Lead');
    expect(ctrl1.sourceBindings).toHaveLength(1);
    expect(ctrl1.sourceBindings![0].entityId).toBe('pfmea-row-1');

    // Test apply with preview hash
    const applied = applyV1ToV2Conversion(v1, previewHash);
    expect(applied).toEqual(v2);

    // Test apply with wrong preview hash throws
    expect(() => applyV1ToV2Conversion(v1, 'wrong-hash')).toThrow('mismatch');

    // Validate readiness
    const readiness = controlPlanReadiness(applied);
    expect(readiness.ready).toBe(true);
    expect(readiness.errors).toHaveLength(0);
  });

  it('detects duplicate IDs in v2 operations and characteristics', () => {
    const v2 = emptyCpDocumentV2();
    v2.operations = [
      {
        id: 'dup-op',
        order: 1,
        number: '10',
        name: 'Op 1',
        resources: [],
        characteristics: [],
      },
      {
        id: 'dup-op',
        order: 2,
        number: '20',
        name: 'Op 2',
        resources: [],
        characteristics: [],
      },
    ];
    expect(() => validateCpDocumentV2(v2)).toThrow('duplicate operation');
  });

  it('rejects controlled reference bypass when system identity is omitted in v2 execution rule', () => {
    const v2 = emptyCpDocumentV2({
      controlPlanNumber: 'CP-1',
      issueDate: '2026-10-23',
      customer: 'Cust',
      organisationName: 'Org',
      organisationPlant: 'Plant',
      partName: 'Part',
      engineeringChangeLevel: 'A',
      keyContact: 'Contact',
      commonPlanDesignation: 'DESIG',
    });
    v2.config.phase = 'production';
    v2.sourceBaselines = [{ revisionId: 'r1', type: 'PFD' }];
    v2.operations = [
      {
        id: 'op-1',
        order: 1,
        number: '10',
        name: 'Assembly',
        resources: [],
        characteristics: [
          {
            id: 'c-1',
            number: '1',
            kind: 'process',
            name: 'Torque',
            criteria: {
              kind: 'numeric',
              specification: '25 Nm',
              tolerance: '+/- 2 Nm',
            },
            classification: '',
            controls: [
              {
                id: 'ctrl-1',
                controlType: 'prevention',
                method: 'Torque tool',
                evaluationMethod: '',
                measurementEquipment: 'DC Tool',
                executionRule: {
                  mode: 'controlled_reference',
                  systemIdentity: '', // omitted!
                },
                reaction: {
                  trigger: 'Interlock',
                  plan: 'Line stop',
                  responsible: 'Team Leader',
                },
                responsibility: 'Operator',
                recordReference: 'MES-01',
              },
            ],
          },
        ],
      },
    ];

    const readiness = controlPlanReadiness(v2);
    expect(readiness.ready).toBe(false);
    expect(readiness.errors.some((e) => e.includes('system identity'))).toBe(true);
  });

  it('validates customer-neutral application baseline profile hash', () => {
    const hash = computeProfileHash(BASELINE_CP_PROFILE_CONTENT);
    expect(hash).toHaveLength(64);
    expect(BASELINE_CP_PROFILE_CONTENT.rules).toHaveLength(12);
    expect(BASELINE_CP_PROFILE_CONTENT.key).toBe('fmeapex-cp-baseline-v1');
  });
});
