import { Body, Controller, Get, Param, Put, ParseIntPipe } from '@nestjs/common';
import { RatingConfigService } from './rating-config.service';
import { UpdateScaleDto } from './dto/update-scale.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('rating-scales')
export class RatingConfigController {
  constructor(private svc: RatingConfigService) {}

  @Get()
  @Public()
  async findAll() {
    return this.svc.findAll();
  }

  @Put(':scale/:value')
  @Permissions('admin.config')
  async update(
    @Param('scale') scale: string,
    @Param('value', ParseIntPipe) value: number,
    @Body() dto: UpdateScaleDto,
  ) {
    return this.svc.update(scale, value, dto);
  }
}
