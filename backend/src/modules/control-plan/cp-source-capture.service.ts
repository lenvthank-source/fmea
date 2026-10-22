import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CpSourceAdapterService, CpSourceBundle } from './cp-source-adapter.service';
import { acquireSourceFence } from '../../common/source-fence';
import { createHash } from 'crypto';

export interface CpCaptureResult {
  captureId: string;
  sourceRevisionId: string;
  sourceScope: string;
  snapshotHash: string;
  capturedAt: Date;
  bundle: CpSourceBundle;
}

@Injectable()
export class CpSourceCaptureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapter: CpSourceAdapterService,
  ) {}

  /**
   * Captures an immutable source snapshot for a given Control Plan revision.
   * Acquires the tenant source fence lock to guarantee fresh, serializable reads.
   */
  async captureSourceSnapshot(
    tenantId: string,
    projectId: string,
    cpRevisionId: string,
    sourceRevisionId: string,
    actorId?: string,
    client?: Prisma.TransactionClient,
  ): Promise<CpCaptureResult> {
    const runCapture = async (tx: Prisma.TransactionClient) => {
      // 1. Acquire tenant source fence
      await acquireSourceFence(tenantId, tx, false);

      // 2. Load complete source bundle
      const bundle = await this.adapter.loadSourceBundle(tenantId, projectId, sourceRevisionId, tx);

      // 3. Compute immutable snapshot hash
      const snapshotJson = JSON.parse(JSON.stringify(bundle));
      const snapshotHash = createHash('sha256')
        .update(JSON.stringify(snapshotJson))
        .digest('hex');

      // 4. Persist immutable CpSourceCapture record
      const capture = await tx.cpSourceCapture.create({
        data: {
          tenantId,
          projectId,
          cpRevisionId,
          sourceRevisionId,
          sourceScope: 'revision',
          snapshot: snapshotJson,
          snapshotHash,
          capturedById: actorId,
        },
      });

      return {
        captureId: capture.id,
        sourceRevisionId,
        sourceScope: 'revision',
        snapshotHash,
        capturedAt: capture.capturedAt,
        bundle,
      };
    };

    if (client) {
      return runCapture(client);
    }
    return this.prisma.$transaction(runCapture);
  }
}
