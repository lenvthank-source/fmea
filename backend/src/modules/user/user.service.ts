import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
}
