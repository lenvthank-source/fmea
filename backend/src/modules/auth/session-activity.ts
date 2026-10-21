import { Logger } from '@nestjs/common';

export type PrismaClientOrTx = {
  user: {
    updateMany: (args: any) => Promise<{ count: number }>;
  };
};

const logger = new Logger('SessionActivity');

export interface RecordSessionParams {
  userId: string;
  tenantId: string;
  timestamp?: Date;
}

/**
 * Monotonically records session establishment (lastLoginAt & lastActivityAt).
 * An older event completing later will not regress a newer timestamp.
 */
export async function recordUserSession(
  client: PrismaClientOrTx,
  params: { userId: string; tenantId: string; timestamp?: Date },
): Promise<{ loginUpdated: boolean; activityUpdated: boolean }> {
  const now = params.timestamp || new Date();

  const loginRes = await client.user.updateMany({
    where: {
      id: params.userId,
      tenantId: params.tenantId,
      status: 'active',
      OR: [
        { lastLoginAt: null },
        { lastLoginAt: { lt: now } },
      ],
    },
    data: { lastLoginAt: now },
  });

  const activityRes = await client.user.updateMany({
    where: {
      id: params.userId,
      tenantId: params.tenantId,
      status: 'active',
      OR: [
        { lastActivityAt: null },
        { lastActivityAt: { lt: now } },
      ],
    },
    data: { lastActivityAt: now },
  });

  return {
    loginUpdated: (loginRes?.count ?? 0) > 0,
    activityUpdated: (activityRes?.count ?? 0) > 0,
  };
}

/**
 * Monotonically records user activity (lastActivityAt only).
 * Does not modify lastLoginAt.
 */
export async function recordUserActivity(
  client: PrismaClientOrTx,
  params: { userId: string; tenantId: string; timestamp?: Date },
): Promise<{ activityUpdated: boolean }> {
  const now = params.timestamp || new Date();

  const activityRes = await client.user.updateMany({
    where: {
      id: params.userId,
      tenantId: params.tenantId,
      status: 'active',
      OR: [
        { lastActivityAt: null },
        { lastActivityAt: { lt: now } },
      ],
    },
    data: { lastActivityAt: now },
  });

  return {
    activityUpdated: (activityRes?.count ?? 0) > 0,
  };
}
