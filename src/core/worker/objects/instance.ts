import EventEmitter from 'events';
import path from 'path';
import { Worker } from 'worker_threads';

export class WorkerPool {
    workerPath = path.join(process.cwd(), 'src/core/worker/index.js');

    eventEmitter = new EventEmitter();
    workerPool: Record<string, boolean> = {};

    spawnWorker(videoHash: string, videoLink: string, mkvAudioTrack?: number) {
        if (videoHash in this.workerPool) {
            throw new Error('worker already spawned, please wait a minute!');
        }

        const worker = new Worker(this.workerPath, {
            workerData: { hash: videoHash, link: videoLink, mkvAudioTrack }
        });
        worker.on('message', (message) => {
            console.log(`${videoHash} worker`, message);
        });
        worker.on('error', (error) => {
            console.error(`${videoHash} worker`, error);
        });
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`${videoHash} worker failed with code ${code}`);
            }

            delete this.workerPool[videoHash];
        });

        this.workerPool[videoHash] = true;
    }

    IsWorkerInProgress(videoHash: string) {
        return videoHash in this.workerPool;
    }
}
