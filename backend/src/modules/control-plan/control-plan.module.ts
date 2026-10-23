import { Module } from '@nestjs/common';
import { ControlPlanDocumentController } from './control-plan-document.controller';
import { ControlPlanDocumentService } from './control-plan-document.service';
import { CpLineageService } from './cp-lineage.service';
import { CpSourceAdapterService } from './cp-source-adapter.service';
import { CpSourceCaptureService } from './cp-source-capture.service';
import { CpReviewService } from './cp-review.service';
import { CpPdfService } from './cp-pdf.service';
import { CpApprovalPackageService } from './cp-approval-package.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ControlPlanDocumentController],
  providers: [
    ControlPlanDocumentService,
    CpLineageService,
    CpSourceAdapterService,
    CpSourceCaptureService,
    CpReviewService,
    CpPdfService,
    CpApprovalPackageService,
  ],
  exports: [
    ControlPlanDocumentService,
    CpLineageService,
    CpSourceAdapterService,
    CpSourceCaptureService,
    CpReviewService,
    CpPdfService,
    CpApprovalPackageService,
  ],
})
export class ControlPlanModule {}
