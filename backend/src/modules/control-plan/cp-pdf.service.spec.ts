import { CpPdfService } from './cp-pdf.service';
import { CpDocumentV2 } from './control-plan-document';

describe('CpPdfService', () => {
  let service: CpPdfService;

  beforeEach(() => {
    service = new CpPdfService();
  });

  it('renders a valid PDF buffer with header and operations table', async () => {
    const mockDoc: CpDocumentV2 = {
      schemaVersion: 2,
      config: {
        phase: 'production',
        safeLaunch: {
          enabled: true,
          entryCriteria: 'Initial 1000 units zero defects',
          exitCriteria: '30 days clean run',
          additionalControls: '100% optical inspection',
        },
        requirementProfileRevisionId: 'profile_rev_1',
        standardProfile: 'fmeapex-cp-baseline-v1',
      },
      header: {
        controlPlanNumber: 'CP-2026-001',
        partName: 'Transmission Housing',
        orgPartNumber: 'TH-90210',
        customer: 'Apex Motors',
        customerPartNumber: 'AM-4421',
        organisationName: 'Apex Precision Mfg',
        organisationPlant: 'Plant 4',
        keyContact: 'Jane Engineer (Ext 402)',
        originationDate: '2026-01-15',
        latestChangeLevel: 'Rev C',
        engineeringChangeLevel: 'ECO-8812',
      },
      sourceBaselines: [],
      operations: [
        {
          id: 'op_10',
          number: '10',
          name: 'CNC Milling Face A',
          applicability: 'standard',
          resources: [{ id: 'res_1', kind: 'machine', text: 'Matsuura 5-Axis #3' }],
          characteristics: [
            {
              id: 'char_10_1',
              number: '1',
              kind: 'product',
              description: 'Surface Flatness Face A',
              classification: 'critical',
              criteria: {
                kind: 'numeric',
                specification: '0.05 mm',
                tolerance: '+/- 0.01 mm',
              },
              controls: [
                {
                  id: 'ctrl_10_1_1',
                  controlType: 'detection',
                  method: 'CMM Inspection',
                  evaluationMethod: 'Zeiss CMM Probe',
                  executionRule: {
                    kind: 'count',
                    sampleSize: 3,
                    frequency: 'Per Lot (500 pcs)',
                  },
                  reaction: {
                    plan: 'Quarantine lot, notify Quality Lead, recalibrate tool offset',
                  },
                  responsibility: 'QC Tech / Line Lead',
                },
              ],
            },
          ],
        },
      ],
    };

    const pdfBuffer = await service.renderControlPlanPdf(mockDoc, {
      scope: 'full',
      approvedStamp: {
        approvedAt: new Date().toISOString(),
        approverName: 'Quality Director',
        packageId: 'pkg_123',
      },
    });

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // PDF Magic bytes: %PDF
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('supports selected operations filtering', async () => {
    const mockDoc: CpDocumentV2 = {
      schemaVersion: 2,
      config: {
        phase: 'prototype',
        safeLaunch: { enabled: false },
        standardProfile: 'fmeapex-cp-baseline-v1',
      },
      header: {
        controlPlanNumber: 'CP-TEST-FILTER',
      },
      sourceBaselines: [],
      operations: [
        {
          id: 'op_1',
          number: '10',
          name: 'Operation 1',
          applicability: 'standard',
          resources: [],
          characteristics: [],
        },
        {
          id: 'op_2',
          number: '20',
          name: 'Operation 2',
          applicability: 'standard',
          resources: [],
          characteristics: [],
        },
      ],
    };

    const pdfBuffer = await service.renderControlPlanPdf(mockDoc, {
      scope: 'selected',
      selectedOperationIds: ['op_2'],
    });

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
