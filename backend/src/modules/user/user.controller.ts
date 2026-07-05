import { Controller, Get, Delete, Param, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Permissions('admin.users')
  async findAll(@Request() req: RequestWithUser) {
    return this.userService.findAll(req.user.tenantId);
  }

  @Delete(':id')
  @Permissions('admin.users')
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.userService.remove(req.user.tenantId, req.user.sub, id);
  }
}
