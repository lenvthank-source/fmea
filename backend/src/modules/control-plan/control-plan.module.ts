import { ControlPlanDocumentController } from './control-plan-document.controller';
import { ControlPlanDocumentService } from './control-plan-document.service';
import { Module } from '@nestjs/common';
import { ControlPlanRowController } from './control-plan-row.controller';
import { ControlPlanRowService } from './control-plan-row.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ControlPlanRowController, ControlPlanDocumentController],
  providers: [ControlPlanRowService, ControlPlanDocumentService],
})
export class ControlPlanModule {}
