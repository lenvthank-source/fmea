import { Module } from '@nestjs/common';
import { RatingConfigService } from './rating-config.service';
import { RatingConfigController } from './rating-config.controller';

@Module({
  controllers: [RatingConfigController],
  providers: [RatingConfigService],
  exports: [RatingConfigService],
})
export class RatingConfigModule {}
