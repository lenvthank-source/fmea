import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface EngineeringActor {
  tenantId: string;
  userId: string;
  isGuest?: boolean;
}
type Client = PrismaService | Prisma.TransactionClient;

export async function assertEngineeringProjectAccess(
  db: Client,
  actor: EngineeringActor,
  projectId: string,
  write = false,
) {
  const project = await db.project.findFirst({
    where: { id: projectId, tenantId: actor.tenantId },
  });
  if (!project) throw new NotFoundException('Project not found');
  const user = await db.user.findFirst({
    where: { id: actor.userId, tenantId: actor.tenantId },
  });
  if (!user || user.status !== 'active')
    throw new ForbiddenException('Actor not active');
  const reference =
    (project.uiSettings as { isDemo?: boolean } | null)?.isDemo === true ||
    project.id === 'c439cfbe-548a-4e25-a37c-0194652b8526';
  const ownActive =
    project.createdById === actor.userId &&
    project.status !== 'archived' &&
    project.createdAt.getTime() > Date.now() - 86400000;
  if (
    (actor.isGuest || user.isGuest) &&
    ((write && (reference || !ownActive)) ||
      (!write && !reference && !ownActive))
  )
    throw new ForbiddenException('Trial project access denied');
  if (
    write &&
    user.isGuest &&
    user.guestExpiresAt &&
    user.guestExpiresAt.getTime() < Date.now()
  )
    throw new ForbiddenException('Trial editing period expired');
  return project;
}

/** Call inside the same transaction as the write. The conditional update locks the
 * revision row, serializing document saves with submission/approval. */
export async function assertEngineeringRevisionAccess(
  db: Client,
  actor: EngineeringActor,
  revisionId: string,
  expectedType?: string,
  write = false,
) {
  const revision = await db.documentRevision.findFirst({
    where: { id: revisionId, document: { tenantId: actor.tenantId } },
    include: { document: { include: { project: true } } },
  });
  if (!revision) throw new NotFoundException('Revision not found');
  if (expectedType && revision.document.type !== expectedType)
    throw new BadRequestException(`Expected ${expectedType} revision`);
  const project = revision.document.project;
  if (write && project.status === 'archived')
    throw new ForbiddenException('Archived engineering projects are read only');
  // Resolve guest status from the database too; never rely on a caller omitting a claim.
  const user = await db.user.findFirst({
    where: { id: actor.userId, tenantId: actor.tenantId },
    select: { isGuest: true, status: true, guestExpiresAt: true },
  });
  if (!user || (user.status && user.status !== 'active'))
    throw new ForbiddenException('Actor not active');
  if (
    write &&
    user.isGuest &&
    user.guestExpiresAt &&
    user.guestExpiresAt.getTime() < Date.now()
  )
    throw new ForbiddenException('Trial editing period expired');
  const settings = project.uiSettings as Record<string, unknown> | null;
  const reference =
    settings?.isDemo === true ||
    project.id === 'c439cfbe-548a-4e25-a37c-0194652b8526';
  const ownActive =
    project.createdById === actor.userId &&
    project.status !== 'archived' &&
    project.createdAt.getTime() > Date.now() - 86400000;
  const guest = actor.isGuest || user.isGuest;
  if (
    guest &&
    ((write && (reference || !ownActive)) ||
      (!write && !reference && !ownActive))
  )
    throw new ForbiddenException(
      'Trial access is limited to the reference and your active project',
    );
  if (write) {
    const locked = await db.documentRevision.updateMany({
      where: {
        id: revisionId,
        status: 'draft',
        lockedAt: null,
        document: { tenantId: actor.tenantId },
      },
      data: { pfdGraphVersion: { increment: 0 } },
    });
    if (locked.count !== 1)
      throw new ConflictException(
        'Revision is protected or no longer a draft. Reload before editing.',
      );
  }
  return Object.assign(revision, {
    projectWritable:project.status!=='archived'&&(!guest||(ownActive&&!reference))&&!(user.isGuest&&user.guestExpiresAt&&user.guestExpiresAt.getTime()<Date.now()),
    writable:
      revision.status === 'draft' &&
      !revision.lockedAt &&
      (!guest || (ownActive && !reference)),
  });
}
