import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { PermissionGuard } from './modules/auth/guards/permission.guard';
import { ProjectModule } from './modules/project/project.module';
import { PfdModule } from './modules/pfd/pfd.module';
import { PfmeaModule } from './modules/pfmea/pfmea.module';
import { ActionModule } from './modules/action/action.module';
import { StructureLinkageModule } from './modules/structure-linkage/structure-linkage.module';
import { UserModule } from './modules/user/user.module';
import { ControlPlanModule } from './modules/control-plan/control-plan.module';
import { AuditLogModule } from './modules/audit/audit-log.module';
import { RepositoryModule } from './modules/repository/repository.module';
import { AuditInterceptor } from './common/audit.interceptor';
import { PrismaService } from './prisma/prisma.service';
import { AuditLogService } from './modules/audit/audit-log.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectModule,
    PfdModule,
    PfmeaModule,
    ControlPlanModule,
    ActionModule,
    StructureLinkageModule,
    UserModule,
    AuditLogModule,
    RepositoryModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 300,
    }]),
    QueuesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    PrismaService,
    AuditLogService,
  ],
})
export class AppModule {}
