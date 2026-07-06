import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async checkAndArchiveInactiveUsers(tenantId: string) {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Update status to 'archived' for users who haven't logged in for 15 days,
    // or who signed up 15 days ago and never logged in, excluding Admins.
    await this.prisma.user.updateMany({
      where: {
        tenantId,
        status: 'active',
        userRoles: {
          none: {
            role: { name: 'Admin' }
          }
        },
        OR: [
          { lastLoginAt: { lt: fifteenDaysAgo } },
          {
            lastLoginAt: null,
            createdAt: { lt: fifteenDaysAgo }
          }
        ]
      },
      data: { status: 'archived' }
    });
  }

  async findAll(tenantId: string) {
    // Run the inactivity check before listing users
    await this.checkAndArchiveInactiveUsers(tenantId);

    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async remove(tenantId: string, currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('You cannot delete yourself');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this user');
    }

    const isAdmin = user.userRoles.some((ur) => ur.role.name === 'Admin');
    if (isAdmin) {
      throw new ForbiddenException('Admin users cannot be deleted');
    }

    // Physical deletion of user
    return this.prisma.user.delete({
      where: { id: targetUserId }
    });
  }

  async getOrCreateRole(tenantId: string, roleName: string, tx: any) {
    let role = await tx.role.findFirst({
      where: { tenantId, name: roleName },
    });

    if (!role) {
      role = await tx.role.create({
        data: {
          tenantId,
          name: roleName,
          description: `${roleName} role`,
          isSystem: false,
        },
      });

      let permCodes: string[] = [];
      if (roleName === 'Admin') {
        const allPerms = await tx.permission.findMany();
        permCodes = allPerms.map((p: any) => p.code);
      } else if (roleName === 'Design Engineer') {
        permCodes = ['project.view', 'pfmea.view', 'cp.view', 'dfmea.create', 'dfmea.edit', 'dfmea.view', 'dfmea.delete', 'action.create', 'action.edit', 'action.view', 'action.close'];
      } else if (roleName === 'Process Engineer') {
        permCodes = ['project.view', 'pfd.create', 'pfd.edit', 'pfd.view', 'pfd.delete', 'pfmea.view', 'cp.view', 'action.create', 'action.edit', 'action.view', 'action.close'];
      } else if (roleName === 'Quality Engineer') {
        permCodes = ['project.view', 'project.edit', 'pfmea.create', 'pfmea.edit', 'pfmea.view', 'pfmea.delete', 'cp.create', 'cp.edit', 'cp.view', 'cp.delete', 'revision.create', 'revision.submit', 'action.create', 'action.edit', 'action.view', 'action.close'];
      } else if (roleName === 'Production Engineer') {
        permCodes = ['project.view', 'pfmea.view', 'dfmea.view', 'cp.view', 'action.view', 'action.close'];
      } else if (roleName === 'Maintenance') {
        permCodes = ['project.view', 'pfmea.view', 'dfmea.view', 'cp.view'];
      } else if (roleName === 'Program Management') {
        permCodes = ['project.view', 'pfmea.view', 'dfmea.view', 'cp.view', 'action.view'];
      }

      if (permCodes.length > 0) {
        const dbPerms = await tx.permission.findMany({
          where: { code: { in: permCodes } },
        });
        await tx.rolePermission.createMany({
          data: dbPerms.map((p: any) => ({
            roleId: role.id,
            permissionId: p.id,
          })),
        });
      }
    }

    return role;
  }

  async update(
    tenantId: string,
    targetUserId: string,
    dto: { roleName?: string; password?: string }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('User not found in this tenant');
    }

    return this.prisma.$transaction(async (tx) => {
      const dataToUpdate: any = {};
      if (dto.password) {
        dataToUpdate.passwordHash = await bcrypt.hash(dto.password, 12);
      }

      if (Object.keys(dataToUpdate).length > 0) {
        await tx.user.update({
          where: { id: targetUserId },
          data: dataToUpdate,
        });
      }

      if (dto.roleName) {
        const role = await this.getOrCreateRole(tenantId, dto.roleName, tx);

        // Delete existing user roles
        await tx.userRole.deleteMany({
          where: { userId: targetUserId },
        });

        // Create new user role
        await tx.userRole.create({
          data: {
            userId: targetUserId,
            roleId: role.id,
          },
        });
      }

      return { success: true };
    });
  }
}
