import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { StructureLinkageService } from './structure-linkage.service';
import { CreateStructureFailureDto } from './dto/create-structure-failure.dto';
import { UpdateStructureFailureDto } from './dto/update-structure-failure.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('structure-failures')
export class StructureFailureController {
  constructor(private service: StructureLinkageService) {}

  @Post()
  @Permissions('pfmea.edit')
  create(
    @Request() req: RequestWithUser,
    @Body() dto: CreateStructureFailureDto,
  ) {
    return this.service.createFailure(req.user.tenantId, dto);
  }

  @Get()
  @Permissions('pfmea.view')
  list(
    @Request() req: RequestWithUser,
    @Query('functionId') functionId: string,
  ) {
    return this.service.getFailures(req.user.tenantId, functionId);
  }

  @Patch(':id')
  @Permissions('pfmea.edit')
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateStructureFailureDto,
  ) {
    return this.service.updateFailure(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('pfmea.edit')
  remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.service.deleteFailure(req.user.tenantId, id);
  }
}
