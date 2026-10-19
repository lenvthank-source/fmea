import { RevisionGuard } from '../../common/revision-guard';
import { Module } from '@nestjs/common';
import { RepositoryService } from './repository.service';
import { RepositoryController } from './repository.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RepositoryController],
  providers: [RepositoryService, RevisionGuard],
  exports: [RepositoryService],
})
export class RepositoryModule {}
