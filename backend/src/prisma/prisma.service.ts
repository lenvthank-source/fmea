import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    let url = process.env.DATABASE_URL;
    if (url && !url.includes('connect_timeout=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}connect_timeout=30`;
    }

    super(
      url
        ? {
            datasources: {
              db: {
                url,
              },
            },
          }
        : undefined,
    );
  }

  async onModuleInit() {
    await this.$connect();
    await this.seedDefaultData();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async seedDefaultData() {
    try {
      const tenantCount = await this.tenant.count();
      if (tenantCount > 0) {
        return; // Already seeded
      }

      const subdomain = 'guest-tenant';

      await this.$transaction(async (tx) => {
        // Create default tenant
        const tenant = await tx.tenant.create({
          data: {
            name: 'FMEA Workspace',
            subdomain,
          },
        });

        // Create permissions
        const permissions = [
          { code: 'admin.users', description: 'Manage users', module: 'admin' },
          { code: 'project.create', description: 'Create projects', module: 'project' },
          { code: 'project.edit', description: 'Edit projects', module: 'project' },
          { code: 'project.view', description: 'View projects', module: 'project' },
          { code: 'project.delete', description: 'Delete projects', module: 'project' },
          
          { code: 'pfmea.create', description: 'Create PFMEA rows', module: 'pfmea' },
          { code: 'pfmea.edit', description: 'Edit PFMEA rows', module: 'pfmea' },
          { code: 'pfmea.view', description: 'View PFMEA rows', module: 'pfmea' },
          { code: 'pfmea.delete', description: 'Delete PFMEA rows', module: 'pfmea' },
          
          { code: 'dfmea.create', description: 'Create DFMEA rows', module: 'dfmea' },
          { code: 'dfmea.edit', description: 'Edit DFMEA rows', module: 'dfmea' },
          { code: 'dfmea.view', description: 'View DFMEA rows', module: 'dfmea' },
          { code: 'dfmea.delete', description: 'Delete DFMEA rows', module: 'dfmea' },

          { code: 'cp.create', description: 'Create Control Plan rows', module: 'control_plan' },
          { code: 'cp.edit', description: 'Edit Control Plan rows', module: 'control_plan' },
          { code: 'cp.view', description: 'View Control Plan rows', module: 'control_plan' },
          { code: 'cp.delete', description: 'Delete Control Plan rows', module: 'control_plan' },

          { code: 'revision.create', description: 'Create document revisions', module: 'revision' },
          { code: 'revision.submit', description: 'Submit document revisions', module: 'revision' },
          { code: 'revision.review', description: 'Review document revisions', module: 'revision' },
          { code: 'revision.approve', description: 'Approve document revisions', module: 'revision' },

          { code: 'action.create', description: 'Create actions', module: 'action' },
          { code: 'action.edit', description: 'Edit actions', module: 'action' },
          { code: 'action.view', description: 'View actions', module: 'action' },
          { code: 'action.close', description: 'Close/complete actions', module: 'action' },
        ];

        await tx.permission.createMany({
          data: permissions,
          skipDuplicates: true,
        });

        const dbPermissions = await tx.permission.findMany();

        // Create Admin Role
        const adminRole = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: 'Admin',
            description: 'Tenant Administrator with full access rights',
            isSystem: true,
          },
        });

        // Create QE Role
        const qeRole = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: 'Quality Engineer',
            description: 'Standard engineer responsible for FMEA authoring',
            isSystem: true,
          },
        });

        // Create standard user roles
        await tx.role.createMany({
          data: [
            { tenantId: tenant.id, name: 'Reviewer', description: 'Team member responsible for reviewing drafts', isSystem: true },
            { tenantId: tenant.id, name: 'Approver', description: 'Authorized sign-off authority', isSystem: true },
            { tenantId: tenant.id, name: 'Viewer', description: 'Read-only access to all FMEA documents', isSystem: true },
          ],
        });

        // Map Permissions to Admin Role (All)
        await tx.rolePermission.createMany({
          data: dbPermissions.map((p) => ({
            roleId: adminRole.id,
            permissionId: p.id,
          })),
        });

        // Map Permissions to QE Role
        const qePermCodes = [
          'project.create', 'project.view', 'project.edit',
          'pfmea.create', 'pfmea.edit', 'pfmea.view', 'pfmea.delete',
          'dfmea.create', 'dfmea.edit', 'dfmea.view', 'dfmea.delete',
          'cp.create', 'cp.edit', 'cp.view', 'cp.delete',
          'revision.create', 'revision.submit',
          'action.create', 'action.edit', 'action.view', 'action.close',
        ];
        const qePerms = dbPermissions.filter((p) => qePermCodes.includes(p.code));
        await tx.rolePermission.createMany({
          data: qePerms.map((p) => ({
            roleId: qeRole.id,
            permissionId: p.id,
          })),
        });

        // Create default guest user (no password, alphanumeric username)
        const guestUser = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: 'guest123',
            name: 'Guest User',
            passwordHash: null,
          },
        });

        // Assign Quality Engineer role to guest user
        await tx.userRole.create({
          data: {
            userId: guestUser.id,
            roleId: qeRole.id,
          },
        });
      });
    } catch (e) {
      console.error('Failed to seed default database:', e);
    }
  }
}
