import { Global, Module } from '@nestjs/common';
import { RevisionGuard } from './revision-guard';

@Global()
@Module({
  providers: [RevisionGuard],
  exports: [RevisionGuard],
})
export class CommonModule {}
