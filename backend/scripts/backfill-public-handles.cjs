// Safe rollout repair for trial users created by an older API during migration.
const { PrismaClient } = require('@prisma/client');
const { reservePublicHandle } = require('../dist/modules/auth/public-handle');
const prisma = new PrismaClient();
(async () => {
  let repaired = 0;
  for (const tenant of await prisma.tenant.findMany({ select: { id: true } })) {
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id, isGuest: true, publicHandle: null }, select: { id: true },
    });
    for (const user of users) await prisma.$transaction(async tx => {
      const current = await tx.user.findFirst({ where: { id: user.id, tenantId: tenant.id, isGuest: true, publicHandle: null } });
      if (!current) return;
      const publicHandle = await reservePublicHandle(tx);
      const result = await tx.user.updateMany({ where: { id: user.id, tenantId: tenant.id, publicHandle: null }, data: { publicHandle } });
      if (result.count !== 1) throw new Error('Concurrent handle assignment; retry repair');
      repaired++;
    });
  }
  console.log(JSON.stringify({ repaired }));
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
