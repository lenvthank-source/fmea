import { Prisma } from '@prisma/client';

export interface SourceFenceResult {
  generation: number;
}

/**
 * Acquires the tenant-level EngineeringSourceFence row lock inside the active transaction.
 * Consistent lock order: source fence -> sorted revision IDs -> aggregate row.
 * Never hold this lock during PDF rendering, file storage, or external network I/O.
 */
export async function acquireSourceFence(
  tenantId: string,
  tx: Prisma.TransactionClient,
  incrementGeneration = false,
): Promise<SourceFenceResult> {
  // Ensure the tenant row exists in engineering_source_fence
  await tx.$executeRaw`
    INSERT INTO "engineering_source_fence" ("tenant_id", "generation", "updated_at")
    VALUES (${tenantId}::uuid, 0, NOW())
    ON CONFLICT ("tenant_id") DO NOTHING
  `;

  if (incrementGeneration) {
    const rows = await tx.$queryRaw<Array<{ generation: number }>>`
      UPDATE "engineering_source_fence"
      SET "generation" = "generation" + 1, "updated_at" = NOW()
      WHERE "tenant_id" = ${tenantId}::uuid
      RETURNING "generation"
    `;
    return { generation: rows[0]?.generation ?? 1 };
  }

  const rows = await tx.$queryRaw<Array<{ generation: number }>>`
    SELECT "generation" FROM "engineering_source_fence"
    WHERE "tenant_id" = ${tenantId}::uuid
    FOR UPDATE
  `;
  return { generation: rows[0]?.generation ?? 0 };
}
