import { assertEngineeringRevisionAccess } from '../../common/engineering-access';
import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';
import { BASELINE_CP_PROFILE_CONTENT, computeProfileHash } from './cp-profile-baseline';
import { CpDocumentV2 } from './control-plan-document';

export interface RecordReviewDto {
  observedDocumentVersion: number;
  targetKind: 'operation' | 'characteristic' | 'control' | 'resource';
  targetId: string;
  targetPath?: string;
  value: unknown;
  sourceSetHash?: string;
  mappingHash?: string;
  decision: 'accept' | 'modify_accept' | 'reject' | 'not_applicable' | 'retain_current' | 'defer';
  reason?: string;
}

export interface ValidationFinding {
  ruleId: string;
  category: 'blocker' | 'warning' | 'information';
  locator: string;
  message: string;
}

export interface ValidationRunResult {
  runId: string;
  isValid: boolean;
  documentHash: string;
  sourceSetHash: string;
  profileRevisionId: string;
  findings: ValidationFinding[];
  createdAt: Date;
}

@Injectable()
export class CpReviewService {
  constructor(private readonly prisma: PrismaService) {}

  computeValueHash(val: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(val ?? ''))
      .digest('hex');
  }

  /**
   * Appends an immutable content-bound field review decision.
   */
  async recordReviewDecision(
    tenantId: string,
    cpRevisionId: string,
    actorId: string,
    dto: RecordReviewDto,
    client?: Prisma.TransactionClient,
  ): Promise<{ decisionId: string; valueHash: string }> {
    const db = client ?? this.prisma;

    if (!dto.decision) {
      throw new BadRequestException('A review decision must be selected.');
    }

    if (['reject', 'not_applicable', 'retain_current', 'modify_accept'].includes(dto.decision) && !dto.reason?.trim()) {
      throw new BadRequestException(`A reason is required for decision '${dto.decision}'.`);
    }

    await assertEngineeringRevisionAccess(
      db,
      { tenantId, userId: actorId },
      cpRevisionId,
      'CONTROL_PLAN',
      true,
    );

    const valueHash = this.computeValueHash(dto.value);

    const record = await db.cpReviewDecision.create({
      data: {
        tenantId,
        cpRevisionId,
        observedDocumentVersion: dto.observedDocumentVersion,
        targetKind: dto.targetKind,
        targetId: dto.targetId,
        targetPath: dto.targetPath,
        valueHash,
        sourceSetHash: dto.sourceSetHash,
        mappingHash: dto.mappingHash,
        decision: dto.decision,
        reason: dto.reason?.trim(),
        actorId,
      },
    });

    return { decisionId: record.id, valueHash };
  }

  /**
   * Retrieves all review decisions recorded for a revision.
   */
  async getReviewDecisions(
    tenantId: string,
    cpRevisionId: string,
    client?: Prisma.TransactionClient,
  ) {
    const db = client ?? this.prisma;
    return db.cpReviewDecision.findMany({
      where: { tenantId, cpRevisionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Executes a formal validation run binding document, profile, and reviews.
   * Creates an immutable CpValidationRun record.
   */
  async runValidation(
    tenantId: string,
    cpRevisionId: string,
    doc: CpDocumentV2,
    sourceSetHash = '',
    actorId?: string,
    client?: Prisma.TransactionClient,
  ): Promise<ValidationRunResult> {
    const db = client ?? this.prisma;

    const findings: ValidationFinding[] = [];
    const documentHash = createHash('sha256')
      .update(JSON.stringify(doc))
      .digest('hex');

    const profile = BASELINE_CP_PROFILE_CONTENT;
    const profileHash = computeProfileHash(profile);

    // Rule checks
    // HDR-001: Required Header Fields
    for (const key of [
      'controlPlanNumber',
      'issueDate',
      'customer',
      'organisationName',
      'organisationPlant',
      'partName',
      'engineeringChangeLevel',
      'keyContact',
    ]) {
      if (!doc.header[key]?.trim()) {
        findings.push({
          ruleId: 'HDR-001',
          category: 'blocker',
          locator: `header.${key}`,
          message: `Header field '${key}' must be recorded.`,
        });
      }
    }

    // HDR-002: Part Identification
    if (!doc.header.orgPartNumber?.trim() && !doc.header.commonPlanDesignation?.trim()) {
      findings.push({
        ruleId: 'HDR-002',
        category: 'blocker',
        locator: 'header.orgPartNumber',
        message: 'Covered part number(s) or common plan designation must be identified.',
      });
    }

    // CFG-001: Phase Selection
    if (doc.config.phase === 'unspecified') {
      findings.push({
        ruleId: 'CFG-001',
        category: 'blocker',
        locator: 'config.phase',
        message: 'Control plan phase must be selected.',
      });
    }

    // CFG-002: Source Baselines
    if (!doc.sourceBaselines.length && !doc.config.sourceExceptionJustification?.trim()) {
      findings.push({
        ruleId: 'CFG-002',
        category: 'blocker',
        locator: 'config.sourceExceptionJustification',
        message: 'Select source baselines or document a reviewed source exception.',
      });
    }

    // CFG-003: Safe Launch
    if (doc.config.safeLaunch.enabled) {
      if (!doc.config.safeLaunch.entryCriteria.trim()) {
        findings.push({ ruleId: 'CFG-003', category: 'blocker', locator: 'config.safeLaunch.entryCriteria', message: 'Safe launch requires entry criteria.' });
      }
      if (!doc.config.safeLaunch.exitCriteria.trim()) {
        findings.push({ ruleId: 'CFG-003', category: 'blocker', locator: 'config.safeLaunch.exitCriteria', message: 'Safe launch requires exit criteria.' });
      }
      if (!doc.config.safeLaunch.additionalControls.trim()) {
        findings.push({ ruleId: 'CFG-003', category: 'blocker', locator: 'config.safeLaunch.additionalControls', message: 'Safe launch requires additional controls.' });
      }
    }

    // OPR-001: Operation completeness
    if (!doc.operations.length) {
      findings.push({ ruleId: 'OPR-001', category: 'blocker', locator: 'operations', message: 'At least one operation section is required.' });
    }

    for (const [opIdx, op] of doc.operations.entries()) {
      const opLoc = `operations[${opIdx}]`;
      if (!op.number.trim()) findings.push({ ruleId: 'OPR-001', category: 'blocker', locator: `${opLoc}.number`, message: 'Operation number is required.' });
      if (!op.name.trim()) findings.push({ ruleId: 'OPR-001', category: 'blocker', locator: `${opLoc}.name`, message: 'Operation name is required.' });

      for (const [charIdx, char] of op.characteristics.entries()) {
        const charLoc = `${opLoc}.characteristics[${charIdx}]`;
        if (char.kind === 'unspecified') {
          findings.push({ ruleId: 'CHR-001', category: 'blocker', locator: `${charLoc}.kind`, message: 'Classify product or process characteristic.' });
        }
        if (!char.criteria.specification.trim() && !char.criteria.controlledReference?.trim()) {
          findings.push({ ruleId: 'CHR-002', category: 'blocker', locator: `${charLoc}.criteria`, message: 'Specification or controlled reference required.' });
        }

        for (const [ctrlIdx, ctrl] of char.controls.entries()) {
          const ctrlLoc = `${charLoc}.controls[${ctrlIdx}]`;
          if (!ctrl.method.trim()) findings.push({ ruleId: 'CTL-001', category: 'blocker', locator: `${ctrlLoc}.method`, message: 'Control method is required.' });
          if (ctrl.controlType === 'detection' && !ctrl.evaluationMethod.trim()) {
            findings.push({ ruleId: 'CTL-001', category: 'blocker', locator: `${ctrlLoc}.evaluationMethod`, message: 'Detection control requires evaluation technique.' });
          }
          if (!ctrl.responsibility.trim()) {
            findings.push({ ruleId: 'CTL-003', category: 'blocker', locator: `${ctrlLoc}.responsibility`, message: 'Responsible owner must be assigned.' });
          }
          if (!ctrl.reaction.plan.trim() && !ctrl.reaction.procedure?.trim()) {
            findings.push({ ruleId: 'CTL-003', category: 'blocker', locator: `${ctrlLoc}.reaction`, message: 'Reaction plan or procedure required.' });
          }
        }
      }
    }

    const blockers = findings.filter((f) => f.category === 'blocker');
    const isValid = blockers.length === 0;

    const run = await db.cpValidationRun.create({
      data: {
        tenantId,
        cpRevisionId,
        documentHash,
        sourceSetHash,
        mappingHash: '',
        profileRevisionId: profile.key,
        profileHash,
        validatorVersion: '1.0.0',
        findings: findings as any,
        actorId,
      },
    });

    return {
      runId: run.id,
      isValid,
      documentHash,
      sourceSetHash,
      profileRevisionId: profile.key,
      findings,
      createdAt: run.createdAt,
    };
  }
}
