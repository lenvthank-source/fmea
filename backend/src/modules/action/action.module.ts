import { Module } from '@nestjs/common';
import { ActionController } from './action.controller';
import { ActionService } from './action.service';
import { R2Service } from './r2.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActionController],
  providers: [ActionService, R2Service],
  exports: [ActionService, R2Service],
})
export class ActionModule {}
