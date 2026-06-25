import { Module } from '@nestjs/common';
import { ControlPlanRowController } from './control-plan-row.controller';
import { ControlPlanRowService } from './control-plan-row.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ControlPlanRowController],
  providers: [ControlPlanRowService],
})
export class ControlPlanModule {}
