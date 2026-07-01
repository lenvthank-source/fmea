import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StructureLinkageService } from './structure-linkage.service';
import { StructureFunctionController } from './structure-function.controller';
import { StructureFailureController } from './structure-failure.controller';
import { FailureLinkController } from './failure-link.controller';
import { LinkActionController } from './link-action.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    StructureFunctionController,
    StructureFailureController,
    FailureLinkController,
    LinkActionController,
  ],
  providers: [StructureLinkageService],
  exports: [StructureLinkageService],
})
export class StructureLinkageModule {}
