import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { StructureLinkageService } from './structure-linkage.service';
import { CreateStructureFunctionDto } from './dto/create-structure-function.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('structure-functions')
export class StructureFunctionController {
  constructor(private service: StructureLinkageService) {}

  @Post()
  @Permissions('pfmea.edit')
  create(
    @Request() req: RequestWithUser,
    @Body() dto: CreateStructureFunctionDto,
  ) {
    return this.service.createFunction(req.user.tenantId, dto);
  }

  @Get()
  @Permissions('pfmea.view')
  list(
    @Request() req: RequestWithUser,
    @Query('parentType') parentType: string,
    @Query('parentId') parentId: string,
  ) {
    return this.service.getFunctions(req.user.tenantId, parentType, parentId);
  }

  @Get('project/:projectId')
  @Permissions('pfmea.view')
  listByProject(
    @Request() req: RequestWithUser,
    @Param('projectId') projectId: string,
  ) {
    return this.service.getProjectFunctions(req.user.tenantId, projectId);
  }

  @Delete(':id')
  @Permissions('pfmea.edit')
  remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.service.deleteFunction(req.user.tenantId, id);
  }
}
