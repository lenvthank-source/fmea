import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  Response,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import {
  IsInt,
  IsObject,
  IsString,
  Min,
  IsArray,
  IsUUID,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { ControlPlanDocumentService } from './control-plan-document.service';
import { CpReviewService } from './cp-review.service';
import { CpSourceAdapterService } from './cp-source-adapter.service';
import { CpPdfService } from './cp-pdf.service';
import { CpApprovalPackageService } from './cp-approval-package.service';
import type { AnyCpDocument, CpDocumentV2 } from './control-plan-document';
import { isCpDocumentV2 } from './control-plan-document';

class SaveCpDocumentDto {
  @IsInt() @Min(0) expectedVersion: number;
  @IsObject() document: AnyCpDocument;
}

class ForkCpDto {
  @IsString() revisionNumber: string;
  @IsString() phase: string;
  @IsString() summary: string;
}

class PreviewCpDto {
  @IsUUID() sourceRevisionId: string;
}

class ApplyCpDto extends PreviewCpDto {
  @IsInt() @Min(0) expectedVersion: number;
  @IsString() sourceFingerprint: string;
  @IsArray() decisions: {
    key: string;
    action: string;
    reason?: string;
    resolutions?: Record<string, 'source' | 'current'>;
  }[];
}

class UpgradePreviewDto {
  @IsInt() @Min(0) expectedVersion: number;
}

class UpgradeApplyDto {
  @IsInt() @Min(0) expectedVersion: number;
  @IsString() previewHash: string;
}

class RecordReviewApiDto {
  @IsInt() @Min(0) observedDocumentVersion: number;
  @IsIn(['operation', 'characteristic', 'control', 'resource'])
  targetKind: 'operation' | 'characteristic' | 'control' | 'resource';
  @IsString() targetId: string;
  @IsOptional() @IsString() targetPath?: string;
  value: unknown;
  @IsOptional() @IsString() sourceSetHash?: string;
  @IsOptional() @IsString() mappingHash?: string;
  @IsIn(['accept', 'modify_accept', 'reject', 'not_applicable', 'retain_current', 'defer'])
  decision: 'accept' | 'modify_accept' | 'reject' | 'not_applicable' | 'retain_current' | 'defer';
  @IsOptional() @IsString() reason?: string;
}

class ValidateCpDto {
  @IsOptional() @IsString() sourceSetHash?: string;
}

class ReportCpDto {
  @IsOptional() @IsIn(['full', 'selected']) scope?: 'full' | 'selected';
  @IsOptional() @IsArray() selectedOperationIds?: string[];
  @IsOptional() @IsIn(['pdf', 'json']) format?: 'pdf' | 'json';
}

class ApprovalIntentApiDto {
  @IsInt() @Min(0) expectedVersion: number;
  @IsUUID() validationRunId: string;
  @IsOptional() @IsString() comment?: string;
}

const actor = (req: RequestWithUser) => ({
  tenantId: req.user.tenantId,
  userId: req.user.sub,
  isGuest: req.user.isGuest,
});

@Controller('revisions/:revisionId/control-plan-document')
export class ControlPlanDocumentController {
  constructor(
    private readonly service: ControlPlanDocumentService,
    private readonly reviewService: CpReviewService,
    private readonly sourceAdapterService: CpSourceAdapterService,
    private readonly pdfService: CpPdfService,
    private readonly approvalPackageService: CpApprovalPackageService,
  ) {}

  @Get()
  @Permissions('cp.view')
  get(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.get(actor(req), id).then((result) => ({
      ...result,
      forkable:
        result.forkable &&
        (req.user.roles.includes('Admin') ||
          req.user.permissions.includes('cp.edit')),
      writable:
        result.writable &&
        (req.user.roles.includes('Admin') ||
          req.user.permissions.includes('cp.edit')),
    }));
  }

  @Put()
  @Permissions('cp.edit')
  save(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: SaveCpDocumentDto,
  ) {
    return this.service.save(actor(req), id, body);
  }

  @Post('fork')
  @Permissions('cp.edit')
  fork(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: ForkCpDto,
  ) {
    return this.service.fork(actor(req), id, body);
  }

  @Post('sync-preview')
  @Permissions('cp.view')
  preview(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: PreviewCpDto,
  ) {
    return this.service.preview(actor(req), id, body.sourceRevisionId);
  }

  @Post('sync-apply')
  @Permissions('cp.edit')
  apply(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: ApplyCpDto,
  ) {
    return this.service.apply(actor(req), id, body);
  }

  // --- V2 Control Plan Evolution Endpoints ---

  @Post('upgrade-preview')
  @Permissions('cp.edit')
  upgradePreview(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: UpgradePreviewDto,
  ) {
    return this.service.upgradePreview(actor(req), id, body.expectedVersion);
  }

  @Post('upgrade-apply')
  @Permissions('cp.edit')
  upgradeApply(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: UpgradeApplyDto,
  ) {
    return this.service.upgradeApply(actor(req), id, {
      expectedVersion: body.expectedVersion,
      previewHash: body.previewHash,
      confirmed: true,
    });
  }

  @Get('source-context')
  @Permissions('cp.view')
  async getSourceContext(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Query('sourceRevisionId') sourceRevisionId: string,
  ) {
    if (!sourceRevisionId) {
      return { availability: 'unavailable', reason: 'sourceRevisionId query parameter required.' };
    }
    const { projectId } = await this.service.getProjectContext(actor(req), id);
    return this.sourceAdapterService.loadSourceBundle(
      req.user.tenantId,
      projectId,
      sourceRevisionId,
    );
  }

  @Post('reviews')
  @Permissions('cp.edit')
  async recordReview(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: RecordReviewApiDto,
  ) {
    return this.reviewService.recordReviewDecision(
      req.user.tenantId,
      id,
      req.user.sub,
      body,
    );
  }

  @Get('reviews')
  @Permissions('cp.view')
  async getReviews(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
  ) {
    return this.reviewService.getReviewDecisions(req.user.tenantId, id);
  }

  @Post('validate')
  @Permissions('cp.view')
  async validate(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: ValidateCpDto,
  ) {
    const loaded = await this.service.get(actor(req), id);
    if (!isCpDocumentV2(loaded.document)) {
      return {
        isValid: false,
        findings: [
          {
            ruleId: 'V2-MIGRATE',
            category: 'blocker',
            locator: 'document',
            message: 'Upgrade document to Schema Version 2 before executing profile validation.',
          },
        ],
      };
    }
    return this.reviewService.runValidation(
      req.user.tenantId,
      id,
      loaded.document,
      body.sourceSetHash,
      req.user.sub,
    );
  }

  @Post('approval-intent')
  @Permissions('cp.edit')
  async recordApprovalIntent(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: ApprovalIntentApiDto,
  ) {
    const approverName =
      req.user.publicHandle || req.user.email || 'Engineering Approver';

    return this.approvalPackageService.executeApprovalWorkflow(
      req.user.tenantId,
      id,
      req.user.sub,
      {
        expectedVersion: body.expectedVersion,
        validationRunId: body.validationRunId,
        comment: body.comment,
        actorName: approverName,
      },
    );
  }

  @Get('packages/:packageId')
  @Permissions('cp.view')
  async getPackage(
    @Request() req: RequestWithUser,
    @Param('packageId', new ParseUUIDPipe()) packageId: string,
  ) {
    return this.approvalPackageService.getPackage(
      req.user.tenantId,
      packageId,
    );
  }

  @Get('packages/:packageId/artifacts/:artifactId')
  @Permissions('cp.view')
  async downloadArtifact(
    @Request() req: RequestWithUser,
    @Param('packageId', new ParseUUIDPipe()) packageId: string,
    @Param('artifactId', new ParseUUIDPipe()) artifactId: string,
    @Response() res: ExpressResponse,
  ) {
    const artifact = await this.approvalPackageService.getArtifact(
      req.user.tenantId,
      packageId,
      artifactId,
    );
    res.setHeader('Content-Type', artifact.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${artifact.name}"`,
    );
    res.send(artifact.data);
  }

  @Post('reports')
  @Permissions('cp.view')
  async generateReport(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: ReportCpDto,
    @Response() res: ExpressResponse,
  ) {
    const loaded = await this.service.get(actor(req), id);
    if (!isCpDocumentV2(loaded.document)) {
      return res.status(400).json({
        message: 'Reports require Control Plan schema version 2.',
      });
    }

    const docV2: CpDocumentV2 = loaded.document;

    if (body.format === 'pdf' || !body.format) {
      const pdfBuffer = await this.pdfService.renderControlPlanPdf(
        docV2,
        {
          scope: body.scope || 'full',
          selectedOperationIds: body.selectedOperationIds,
        },
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="control-plan-${docV2.header.controlPlanNumber || 'report'}.pdf"`,
      );
      return res.send(pdfBuffer);
    }

    // JSON export
    const operations =
      body.scope === 'selected' && body.selectedOperationIds?.length
        ? docV2.operations.filter((op) =>
            body.selectedOperationIds!.includes(op.id),
          )
        : docV2.operations;

    return res.json({
      title: `Control Plan - ${docV2.header.controlPlanNumber || 'Document'}`,
      revisionId: id,
      version: loaded.version,
      scope: body.scope || 'full',
      operationsCount: operations.length,
      operations,
      header: docV2.header,
      config: docV2.config,
    });
  }
}
