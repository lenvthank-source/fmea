import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { PermissionGuard } from './modules/auth/guards/permission.guard';
import { ProjectModule } from './modules/project/project.module';
import { PfdModule } from './modules/pfd/pfd.module';
import { PfmeaModule } from './modules/pfmea/pfmea.module';
import { ControlPlanModule } from './modules/control-plan/control-plan.module';
import { ActionModule } from './modules/action/action.module';

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
  ],
})
export class AppModule {}
