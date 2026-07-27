import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { RepositoryService } from './repository.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
  CreateWorkElementPackageDto,
  UpdateWorkElementPackageDto,
  RejectWorkElementPackageDto,
  ImportWorkElementPackageDto,
} from './repository.dto';

@Controller('repository')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

  /**
   * Submit a new work element package
   */
  @Post('packages')
  @Permissions('pfmea.create', 'pfmea.edit')
  async submitPackage(@Body() dto: CreateWorkElementPackageDto, @Request() req: any) {
    return this.repositoryService.submitPackage(dto, req.user);
  }

  /**
   * Get all approved packages
   */
  @Get('packages')
  async listApproved() {
    return this.repositoryService.listApproved();
  }

  /**
   * Get pending approval queue (Admin only)
   */
  @Get('packages/pending')
  @Permissions('admin.config')
  async listPending() {
    return this.repositoryService.listPendingForAdmin();
  }

  /**
   * Get packages submitted by current user
   */
  @Get('packages/my-submissions')
  async listMySubmissions(@Request() req: any) {
    return this.repositoryService.listMySubmissions(req.user.id);
  }

  /**
   * Get single package by ID
   */
  @Get('packages/:id')
  async getById(@Param('id') id: string) {
    return this.repositoryService.getPackageById(id);
  }

  /**
   * Approve a package (Admin only)
   */
  @Post('packages/:id/approve')
  @Permissions('admin.config')
  async approvePackage(@Param('id') id: string, @Request() req: any) {
    return this.repositoryService.approvePackage(id, req.user);
  }

  /**
   * Reject a package (Admin only)
   */
  @Post('packages/:id/reject')
  @Permissions('admin.config')
  async rejectPackage(
    @Param('id') id: string,
    @Body() dto: RejectWorkElementPackageDto,
    @Request() req: any,
  ) {
    return this.repositoryService.rejectPackage(id, dto, req.user);
  }

  /**
   * Update package (Admin only)
   */
  @Patch('packages/:id')
  @Permissions('admin.config')
  async updatePackage(@Param('id') id: string, @Body() dto: UpdateWorkElementPackageDto) {
    return this.repositoryService.updatePackage(id, dto);
  }

  /**
   * Delete package (Admin only)
   */
  @Delete('packages/:id')
  @Permissions('admin.config')
  async deletePackage(@Param('id') id: string) {
    return this.repositoryService.deletePackage(id);
  }

  /**
   * Import approved package into PFMEA step
   */
  @Post('packages/:id/import')
  @Permissions('pfmea.create', 'pfmea.edit')
  async importPackage(
    @Param('id') id: string,
    @Body() dto: ImportWorkElementPackageDto,
    @Request() req: any,
  ) {
    return this.repositoryService.importPackage(id, dto, req.user);
  }
}
