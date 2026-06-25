import { Module } from '@nestjs/common';
import { PfdService } from './pfd.service';
import { PfdController } from './pfd.controller';

@Module({
  controllers: [PfdController],
  providers: [PfdService],
  exports: [PfdService],
})
export class PfdModule {}
