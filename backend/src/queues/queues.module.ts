import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';

export interface EmbeddingJobData {
  tenantId: string;
  revisionId: string;
  projectId: string;
  documentType: 'PFD' | 'PFMEA' | 'DFMEA' | 'CONTROL_PLAN';
}

export interface VirusScanJobData {
  evidenceId: string;
  fileKey: string;
  fileUrl: string;
}

export interface ReplicationJobData {
  sourceProjectId: string;
  targetProjectId: string;
  includeTypes: ('PFD' | 'PFMEA' | 'DFMEA' | 'CONTROL_PLAN')[];
}

type JobData = EmbeddingJobData | VirusScanJobData | ReplicationJobData;

@Module({})
export class QueuesModule implements OnModuleInit, OnModuleDestroy {
  private embeddingQueue: Queue<EmbeddingJobData> | null = null;
  private virusScanQueue: Queue<VirusScanJobData> | null = null;
  private replicationQueue: Queue<ReplicationJobData> | null = null;
  private workers: Worker<any>[] = [];

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('[QueuesModule] REDIS_URL not set - queues will be inert (no Redis connection)');
      return;
    }

    try {
      this.embeddingQueue = new Queue('embedding', { connection: { url: process.env.REDIS_URL } });
      this.virusScanQueue = new Queue('virus-scan', { connection: { url: process.env.REDIS_URL } });
      this.replicationQueue = new Queue('replication', { connection: { url: process.env.REDIS_URL } });

      console.log('[QueuesModule] BullMQ queues initialized');
    } catch (err) {
      console.error('[QueuesModule] Failed to initialize queues:', err);
    }
  }

  async onModuleDestroy() {
    await Promise.all([
      this.embeddingQueue?.close(),
      this.virusScanQueue?.close(),
      this.replicationQueue?.close(),
      ...this.workers.map(w => w.close()),
    ]);
  }

  getEmbeddingQueue(): Queue<EmbeddingJobData> | null {
    return this.embeddingQueue;
  }

  getVirusScanQueue(): Queue<VirusScanJobData> | null {
    return this.virusScanQueue;
  }

  getReplicationQueue(): Queue<ReplicationJobData> | null {
    return this.replicationQueue;
  }

  async addEmbeddingJob(data: EmbeddingJobData): Promise<void> {
    if (!this.embeddingQueue) {
      console.warn('[QueuesModule] Embedding queue not available (no Redis) - skipping job');
      return;
    }
    await this.embeddingQueue.add('generate-embeddings', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async addVirusScanJob(data: VirusScanJobData): Promise<void> {
    if (!this.virusScanQueue) {
      console.warn('[QueuesModule] Virus scan queue not available (no Redis) - skipping job');
      return;
    }
    await this.virusScanQueue.add('scan-evidence', data, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async addReplicationJob(data: ReplicationJobData): Promise<void> {
    if (!this.replicationQueue) {
      console.warn('[QueuesModule] Replication queue not available (no Redis) - skipping job');
      return;
    }
    await this.replicationQueue.add('replicate-project', data, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 30000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  // Register workers (to be called from respective modules)
  registerEmbeddingWorker(processor: (job: Job<EmbeddingJobData>) => Promise<void>) {
    if (!this.embeddingQueue) return;
    const worker = new Worker('embedding', processor, { connection: { url: process.env.REDIS_URL! } });
    this.workers.push(worker);
  }

  registerVirusScanWorker(processor: (job: Job<VirusScanJobData>) => Promise<void>) {
    if (!this.virusScanQueue) return;
    const worker = new Worker('virus-scan', processor, { connection: { url: process.env.REDIS_URL! } });
    this.workers.push(worker);
  }

  registerReplicationWorker(processor: (job: Job<ReplicationJobData>) => Promise<void>) {
    if (!this.replicationQueue) return;
    const worker = new Worker('replication', processor, { connection: { url: process.env.REDIS_URL! } });
    this.workers.push(worker);
  }
}