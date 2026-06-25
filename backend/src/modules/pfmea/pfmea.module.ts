import { Module } from '@nestjs/common';
import { PfmeaRowController } from './pfmea-row.controller';
import { PfmeaRowService } from './pfmea-row.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PfmeaRowController],
  providers: [PfmeaRowService],
})
export class PfmeaModule {}
