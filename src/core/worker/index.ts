import { S3 } from '@aws-sdk/client-s3';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { parentPort, workerData } from 'worker_threads';

import { config } from '../config';

interface IWorkerData {
    hash: string;
    link: string;
    mkvAudioTrack?: number;
}

(async (workerData) => {
    if (!parentPort) {
        console.error('script not run as worker, closing');
        process.exit(1);
    }

    const s3Instance = new S3({
        region: 'auto',
        endpoint: config.awsEndpoint,
        credentials: {
            accessKeyId: config.awsAccessKeyId,
            secretAccessKey: config.awsSecretAccessKey
        }
    });

    const tmpFolder = path.join(process.cwd(), '.data');
    try {
        await fs.access(tmpFolder);
    } catch (_) {
        await fs.mkdir(tmpFolder);
    }

    console.log(workerData);
    console.log(tmpFolder, workerData.hash);
    const tmpVidDir = path.join(tmpFolder, workerData.hash);

    try {
        await fs.access(tmpVidDir);

        console.log('can access');
        await fs.rm(tmpVidDir, { recursive: true, force: true });
    } catch (_) {}

    await fs.mkdir(tmpVidDir);

    const ffmpegProc = spawn(
        'ffmpeg',
        [
            '-i',
            workerData.link,
            '-c',
            'copy',
            '-map',
            '0:v',
            '-map',
            `0:a:${workerData.mkvAudioTrack ?? 0}`,
            '-start_number',
            '0',
            '-hls_time',
            '10',
            '-hls_list_size',
            '0',
            '-f',
            'hls',
            `${path.join(tmpVidDir, 'content.m3u8')}`
        ],
        {
            windowsHide: true,
            stdio: [
                /* Standard: stdin, stdout, stderr */
                'inherit',
                'inherit',
                'inherit',
                /* Custom: pipe:3, pipe:4, pipe:5 */
                'pipe',
                'pipe',
                'pipe'
            ]
        }
    );

    await new Promise(function (resolve, reject) {
        ffmpegProc.on('error', reject);
        ffmpegProc.on('close', resolve);
    });

    const completedHlsChunks = await fs.readdir(tmpVidDir);
    const jobs = [] as Promise<void>[];
    for (const file of completedHlsChunks) {
        const hlsChunk = await fs.readFile(path.join(tmpVidDir, file));
        const uploadFileJob = s3Instance
            .putObject({
                Bucket: config.awsBucket,
                Key: `${workerData.hash}/${file}`,
                Body: hlsChunk
            })
            .then(() => {
                console.log(`${workerData.hash}: uploaded to s3 ${file}`);
            });

        jobs.push(uploadFileJob);
    }

    await Promise.all(jobs);

    await fs.rm(tmpVidDir, { recursive: true, force: true });
    parentPort.postMessage({ job_done: true });
})(workerData as IWorkerData);
