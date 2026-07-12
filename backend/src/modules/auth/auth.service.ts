import { ConflictException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from './interfaces/jwt-payload.interface';

// Default permissions definition
const PERMISSIONS = [
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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    // 1. Resolve tenant
    let tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: dto.subdomain },
    });

    if (tenant) {
      // Tenant exists, check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: tenant.id,
            email: dto.email.trim(),
          },
        },
      });
      if (existingUser) {
        throw new ConflictException('Email is already registered under this subdomain');
      }

      // Create new user inside existing tenant and make them Admin
      return this.prisma.$transaction(async (tx) => {
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: dto.email.trim(),
            name: dto.name,
            passwordHash,
            status: 'active',
          },
        });

        let adminRole = await tx.role.findFirst({
          where: { tenantId: tenant.id, name: 'Admin' },
        });

        const dbPermissions = await tx.permission.findMany();

        if (!adminRole) {
          adminRole = await tx.role.create({
            data: {
              tenantId: tenant.id,
              name: 'Admin',
              description: 'Tenant Administrator with full access rights',
              isSystem: true,
            },
          });
          
          await tx.rolePermission.createMany({
            data: dbPermissions.map((p) => ({
              roleId: adminRole!.id,
              permissionId: p.id,
            })),
          });
        }

        if (!adminRole) {
          throw new Error('Admin role could not be created or retrieved.');
        }

        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: adminRole.id,
          },
        });

        const tokens = await this.generateTokens({
          sub: user.id,
          email: user.email,
          tenantId: tenant.id,
          roles: ['Admin'],
          permissions: dbPermissions.map((p) => p.code),
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          tenant: {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
          },
          ...tokens,
        };
      });
    }

    // 2. Perform Tenant, User, and RBAC setup in a database transaction
    return this.prisma.$transaction(async (tx) => {
      // Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName || dto.subdomain,
          subdomain: dto.subdomain,
        },
      });

      // Hash password
      const passwordHash = await bcrypt.hash(dto.password, 12);

      // Create User
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email.trim(),
          name: dto.name,
          passwordHash,
          status: 'active',
        },
      });

      // Seed core permissions in bulk to minimize DB roundtrips
      let dbPermissions = await tx.permission.findMany();
      if (dbPermissions.length < PERMISSIONS.length) {
        await tx.permission.createMany({
          data: PERMISSIONS,
          skipDuplicates: true,
        });
        dbPermissions = await tx.permission.findMany();
      }

      // Seed roles for this tenant
      const adminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Admin',
          description: 'Tenant Administrator with full access rights',
          isSystem: true,
        },
      });

      const qeRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Quality Engineer',
          description: 'Standard engineer responsible for FMEA authoring',
          isSystem: true,
        },
      });

      const reviewerRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Reviewer',
          description: 'Team member responsible for reviewing drafts',
          isSystem: true,
        },
      });

      const approverRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Approver',
          description: 'Authorized sign-off authority',
          isSystem: true,
        },
      });

      const viewerRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Viewer',
          description: 'Read-only access to all FMEA documents',
          isSystem: true,
        },
      });

      // Map Permissions to Admin Role (All permissions)
      await tx.rolePermission.createMany({
        data: dbPermissions.map((p) => ({
          roleId: adminRole.id,
          permissionId: p.id,
        })),
      });

      // Map Permissions to Quality Engineer Role
      const qePermCodes = [
        'project.view', 'project.edit',
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

      // Map Permissions to Reviewer Role
      const revPermCodes = ['project.view', 'pfmea.view', 'dfmea.view', 'cp.view', 'revision.review', 'action.view'];
      const revPerms = dbPermissions.filter((p) => revPermCodes.includes(p.code));
      await tx.rolePermission.createMany({
        data: revPerms.map((p) => ({
          roleId: reviewerRole.id,
          permissionId: p.id,
        })),
      });

      // Map Permissions to Approver Role
      const appPermCodes = ['project.view', 'pfmea.view', 'dfmea.view', 'cp.view', 'revision.approve', 'action.view'];
      const appPerms = dbPermissions.filter((p) => appPermCodes.includes(p.code));
      await tx.rolePermission.createMany({
        data: appPerms.map((p) => ({
          roleId: approverRole.id,
          permissionId: p.id,
        })),
      });

      // Map Permissions to Viewer Role
      const viewPerms = dbPermissions.filter((p) => p.code.endsWith('.view'));
      await tx.rolePermission.createMany({
        data: viewPerms.map((p) => ({
          roleId: viewerRole.id,
          permissionId: p.id,
        })),
      });

      // Assign Admin Role to User
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      // Retrieve full user claims for token generation
      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        tenantId: tenant.id,
        roles: ['Admin'],
        permissions: dbPermissions.map((p) => p.code),
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
        },
        ...tokens,
      };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
  }

  async login(dto: LoginDto) {
    // 1. Resolve tenant by subdomain
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: dto.subdomain },
    });
    if (!tenant || tenant.status !== 'active') {
      throw new UnauthorizedException('Invalid subdomain or tenant suspended');
    }

    // 2. Resolve user by email inside this tenant
    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: dto.email.trim(),
        },
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is inactive or archived');
    }

    // 3. Verify password
    if (!dto.password) {
      throw new UnauthorizedException('Password is required');
    }

    const isPasswordValid = user.passwordHash ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 4. Extract roles and permissions
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionCodesSet = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionCodesSet.add(rp.permission.code);
      }
    }
    const permissions = Array.from(permissionCodesSet);

    // 5. Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      roles,
      permissions,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      },
      ...tokens,
    };
  }

  async generateTokens(payload: JwtPayload) {
    const accessToken = await this.jwtService.signAsync({ ...payload } as any, {
      secret: this.configService.get<string>('JWT_SECRET') || 'super-secret-fmea-token-key-2026',
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '15m') as any,
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: payload.sub, tenantId: payload.tenantId } as any,
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'super-secret-fmea-refresh-token-key-2026',
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'super-secret-fmea-refresh-token-key-2026',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('User not active');
      }

      const roles = user.userRoles.map((ur) => ur.role.name);
      const permissionCodesSet = new Set<string>();
      for (const ur of user.userRoles) {
        for (const rp of ur.role.rolePermissions) {
          permissionCodesSet.add(rp.permission.code);
        }
      }
      const permissions = Array.from(permissionCodesSet);

      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        roles,
        permissions,
      });

      return tokens;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async findAllTenantUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  async checkUsername(username: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: 'guest-tenant' },
    });
    if (!tenant) {
      return { available: true };
    }
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: username.trim(),
      },
    });
    return { available: !user };
  }

  async createGuestUser() {
    // Find or verify guest tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: 'guest-tenant' },
    });
    if (!tenant) {
      throw new NotFoundException('Guest tenant not configured');
    }

    const shortId = Math.random().toString(36).substring(2, 8);
    const guestEmail = `guest-${shortId}@fmeaworks.app`;
    const guestName = `Guest-${shortId}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 15);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: guestEmail,
          name: guestName,
          passwordHash: null,
          status: 'active',
          isGuest: true,
          guestExpiresAt: expiresAt,
        },
      });

      // Find or create Quality Engineer role for guests
      let qeRole = await tx.role.findFirst({
        where: { tenantId: tenant.id, name: 'Quality Engineer' },
      });

      if (!qeRole) {
        qeRole = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: 'Quality Engineer',
            description: 'Standard engineer responsible for FMEA authoring',
            isSystem: true,
          },
        });

        const qePermCodes = [
          'project.create', 'project.view', 'project.edit',
          'pfmea.create', 'pfmea.edit', 'pfmea.view',
          'dfmea.create', 'dfmea.edit', 'dfmea.view',
          'cp.create', 'cp.edit', 'cp.view',
          'revision.create', 'revision.submit',
          'action.create', 'action.edit', 'action.view', 'action.close',
        ];
        const dbPerms = await tx.permission.findMany({
          where: { code: { in: qePermCodes } },
        });
        if (dbPerms.length > 0) {
          await tx.rolePermission.createMany({
            data: dbPerms.map((p) => ({
              roleId: qeRole!.id,
              permissionId: p.id,
            })),
          });
        }
      }

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: qeRole.id,
        },
      });

      // Fetch permissions for token
      const roleWithPerms = await tx.role.findUnique({
        where: { id: qeRole.id },
        include: { rolePermissions: { include: { permission: true } } },
      });
      const permissions = roleWithPerms?.rolePermissions.map((rp) => rp.permission.code) || [];

      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        tenantId: tenant.id,
        roles: ['Quality Engineer'],
        permissions,
      });

      return {
        user: { id: user.id, email: user.email, name: user.name },
        tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
        isGuest: true,
        ...tokens,
      };
    });
  }

  async createContactInquiry(data: { name: string; email: string; company?: string; type: string; message: string }) {
    return this.prisma.contactInquiry.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company || null,
        type: data.type,
        message: data.message,
      },
    });
  }

  async createUserFeedback(data: {
    userId?: string; userEmail?: string; isGuest?: boolean;
    type: string; message: string; pageUrl: string;
    pageTitle?: string; component?: string;
    errorMessage?: string; errorStack?: string;
    browserInfo?: string; screenSize?: string; metadata?: any;
  }) {
    return this.prisma.userFeedback.create({
      data: {
        userId: data.userId || null,
        userEmail: data.userEmail || null,
        isGuest: data.isGuest || false,
        type: data.type,
        message: data.message,
        pageUrl: data.pageUrl,
        pageTitle: data.pageTitle || null,
        component: data.component || null,
        errorMessage: data.errorMessage || null,
        errorStack: data.errorStack || null,
        browserInfo: data.browserInfo || null,
        screenSize: data.screenSize || null,
        metadata: data.metadata || {},
      },
    });
  }

}
