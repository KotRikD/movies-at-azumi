import { S3 } from '@aws-sdk/client-s3';

import { WorkerPool } from '@/core/worker/objects/instance';

declare module 'fastify' {
    interface FastifyInstance {
        s3: S3;
        workerPool: WorkerPool;
    }
}

export {};
