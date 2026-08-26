import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../modules/audit/audit-log.service';

interface UserWithTenant {
  sub: string;
  tenantId: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly skippedPaths = [
    '/auth/login',
    '/auth/guest',
    '/auth/refresh',
    '/auth/feedback',
    '/auth/contact',
    '/health',
  ];

  constructor(
    @Optional() @Inject(PrismaService) private prisma?: PrismaService,
    @Optional() @Inject(AuditLogService) private auditLogService?: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;

    // Only intercept write mutations
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip auth/health endpoints
    if (this.skippedPaths.some((path) => url.startsWith(path))) {
      return next.handle();
    }

    // Check if user is authenticated
    const user = request.user as UserWithTenant | undefined;
    if (!user?.sub || !user?.tenantId) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          // Only log successful responses
          const statusCode = context.switchToHttp().getResponse()?.statusCode;
          if (statusCode && statusCode >= 400) return;

          this.logAuditEntry(request, user, responseData).catch((err) => {
            console.error('Audit logging failed:', err);
          });
        },
        error: (err) => {
          // Don't log errors here, let the exception filter handle them
        },
      }),
    );
  }

  private async logAuditEntry(
    request: Request,
    user: UserWithTenant,
    responseData: any,
  ): Promise<void> {
    if (!this.prisma || !this.auditLogService) return;

    try {
      // Extract entity info from route
      const { entityType, entityId, action } = this.extractEntityInfo(request);

      if (!entityType || !entityId) return;

      // Sanitize response data (remove sensitive fields)
      const sanitizedNewValue = this.sanitizeForAudit(responseData);

      await this.auditLogService.createEntry({
        tenantId: user.tenantId,
        userId: user.sub,
        entityType,
        entityId,
        action,
        newValue: sanitizedNewValue,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });
    } catch (err) {
      console.error('Failed to create audit entry:', err);
    }
  }

  private extractEntityInfo(request: Request): {
    entityType: string | null;
    entityId: string | null;
    action: string;
  } {
    const method = request.method;
    const url = request.url;

    // Map HTTP methods to actions
    const actionMap: Record<string, string> = {
      POST: 'create',
      PATCH: 'update',
      PUT: 'update',
      DELETE: 'delete',
    };

    const action = actionMap[request.method] || 'unknown';

    // Extract entity type and ID from URL
    // Format: /api/v1/<entity>/<id> or /api/v1/<entity>
    const pathParts = request.url
      .replace('/api/v1/', '')
      .split('/')
      .filter((p) => p);

    let entityType = null;
    let entityId = null;

    if (pathParts.length >= 1) {
      // Map URL segment to entity type
      const typeMap: Record<string, string> = {
        projects: 'project',
        documents: 'document',
        revisions: 'document_revision',
        'pfd-steps': 'process_step',
        'pfmea-rows': 'pfmea_row',
        'control-plan-rows': 'control_plan_row',
        'structure-functions': 'structure_function',
        'structure-failures': 'structure_failure',
        'failure-links': 'failure_link',
        'link-actions': 'link_action',
        actions: 'action',
        'work-element-packages': 'work_element_package',
        users: 'user',
      };
      entityType = typeMap[pathParts[0]] || pathParts[0];
    }

    if (pathParts.length >= 2) {
      // Check if second part is a UUID (entity ID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(pathParts[1])) {
        entityId = pathParts[1];
      }
    }

    // Special cases for nested routes
    if (pathParts[0] === 'revisions' && pathParts[2] === 'activate') {
      entityType = 'document_revision';
      entityId = pathParts[1];
    }

    if (pathParts[0] === 'pfd-steps' && pathParts[2] === 'reorder') {
      entityType = 'process_step';
      entityId = 'batch_reorder';
    }

    return { entityType, entityId, action };
  }

  private sanitizeForAudit(data: any): any {
    if (!data) return undefined;

    // Remove sensitive fields
    const sensitiveKeys = [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'accessToken',
      'secret',
      'authorization',
    ];

    const sanitize = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitize);

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = sanitize(value);
        }
      }
      return result;
    };

    return sanitize(data);
  }
}

interface UserWithTenant {
  sub: string;
  tenantId: string;
}