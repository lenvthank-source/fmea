import { createHash } from 'crypto';

export interface CpProfileRule {
  id: string;
  name: string;
  category: 'blocker' | 'warning' | 'information';
  sourceReference: string;
  description: string;
  applicability: string;
}

export interface CpRequirementProfileContent {
  key: string;
  name: string;
  version: number;
  description: string;
  rules: CpProfileRule[];
}

export const BASELINE_CP_PROFILE_KEY = 'fmeapex-cp-baseline-v1';

export const BASELINE_CP_PROFILE_CONTENT: CpRequirementProfileContent = {
  key: BASELINE_CP_PROFILE_KEY,
  name: 'FMEApex Control Plan Application Baseline v1',
  version: 1,
  description:
    'Customer-neutral application completeness profile based on AIAG-VDA / IATF Annex A.2 baseline data points. Does not certify proprietary customer-specific criteria.',
  rules: [
    {
      id: 'HDR-001',
      name: 'Required Header Fields',
      category: 'blocker',
      sourceReference: 'IATF Annex A.2 / AIAG-VDA CP §2',
      description:
        'Control plan number, issue date, customer, organization name, plant, part name, change level, and contact must be recorded.',
      applicability: 'all',
    },
    {
      id: 'HDR-002',
      name: 'Part Identification',
      category: 'blocker',
      sourceReference: 'IATF Annex A.2',
      description: 'Covered part number(s) or common plan designation must be identified.',
      applicability: 'all',
    },
    {
      id: 'CFG-001',
      name: 'Phase Selection',
      category: 'blocker',
      sourceReference: 'AIAG-VDA 2019 / APQP',
      description: 'Phase must be Prototype, Pre-Launch, or Production.',
      applicability: 'all',
    },
    {
      id: 'CFG-002',
      name: 'Source Baseline Integrity',
      category: 'blocker',
      sourceReference: 'FMEApex Quality Governance Rule 2.2',
      description: 'Source PFD/PFMEA baselines must be linked, or a reviewed exception documented.',
      applicability: 'all',
    },
    {
      id: 'CFG-003',
      name: 'Safe Launch Containment',
      category: 'blocker',
      sourceReference: 'AIAG-VDA Safe Launch Guidelines',
      description:
        'When Safe Launch is enabled, entry criteria, exit criteria, and additional controls must be recorded.',
      applicability: 'safeLaunch',
    },
    {
      id: 'OPR-001',
      name: 'Operation Completeness',
      category: 'blocker',
      sourceReference: 'AIAG-VDA CP Operation Definition',
      description: 'Each operation must have an operation number and name.',
      applicability: 'all',
    },
    {
      id: 'CHR-001',
      name: 'Characteristic Classification',
      category: 'blocker',
      sourceReference: 'AIAG-VDA Process/Product Characteristics',
      description: 'Characteristics must be classified as product or process.',
      applicability: 'all',
    },
    {
      id: 'CHR-002',
      name: 'Characteristic Criteria Specification',
      category: 'blocker',
      sourceReference: 'AIAG-VDA Criteria Requirements',
      description: 'A specification or controlled system reference must be documented.',
      applicability: 'all',
    },
    {
      id: 'CTL-001',
      name: 'Control Strategy & Evaluation',
      category: 'blocker',
      sourceReference: 'AIAG-VDA CP Control Methods',
      description:
        'Method, evaluation method (for detection), and measurement equipment must be specified.',
      applicability: 'all',
    },
    {
      id: 'CTL-002',
      name: 'Execution & Sampling Rule',
      category: 'blocker',
      sourceReference: 'AIAG-VDA CP Sample Size and Frequency',
      description:
        'Execution rule must specify sample quantity and frequency, continuous monitoring, or a controlled reference.',
      applicability: 'all',
    },
    {
      id: 'CTL-003',
      name: 'Reaction Plan & Containment',
      category: 'blocker',
      sourceReference: 'AIAG-VDA Reaction Plan Requirements',
      description: 'Reaction plan or controlled procedure and reaction responsibility must be assigned.',
      applicability: 'all',
    },
    {
      id: 'SRC-001',
      name: 'Source Discrepancy Resolution',
      category: 'blocker',
      sourceReference: 'FMEApex Synchronization Contract D06',
      description: 'All upstream source changes and removals must be explicitly resolved.',
      applicability: 'all',
    },
  ],
};

export function computeProfileHash(content: CpRequirementProfileContent): string {
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}
