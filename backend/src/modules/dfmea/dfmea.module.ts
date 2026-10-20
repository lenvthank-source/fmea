import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RevisionGuard } from '../../common/revision-guard';
import { DfmeaController } from './dfmea.controller';
import { DfmeaService } from './dfmea.service';
@Module({
  imports: [PrismaModule],
  controllers: [DfmeaController],
  providers: [DfmeaService, RevisionGuard],
})
export class DfmeaModule {}
