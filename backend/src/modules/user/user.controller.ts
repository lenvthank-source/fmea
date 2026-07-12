import { Controller, Get, Delete, Param, Request, Patch, Body } from '@nestjs/common';
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

  @Patch(':id')
  @Permissions('admin.users')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: { roleName?: string; password?: string }
  ) {
    return this.userService.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('admin.users')
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.userService.remove(req.user.tenantId, req.user.sub, id);
  }

  @Get('contact-inquiries')
  @Permissions('admin.users')
  async getContactInquiries() {
    return this.userService.getContactInquiries();
  }

  @Patch('contact-inquiries/:id/read')
  @Permissions('admin.users')
  async markInquiryRead(@Param('id') id: string) {
    return this.userService.markInquiryRead(id);
  }

  @Get('feedback')
  @Permissions('admin.users')
  async getUserFeedback() {
    return this.userService.getUserFeedback();
  }

  @Patch('feedback/:id/resolve')
  @Permissions('admin.users')
  async resolveFeedback(@Param('id') id: string) {
    return this.userService.resolveFeedback(id);
  }
}
