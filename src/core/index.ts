import { GetObjectCommandOutput, S3 } from '@aws-sdk/client-s3';
import fastifyNext from '@fastify/nextjs';
import crypto from 'crypto';
import Fastify from 'fastify';
import type { FastifyRequest } from 'fastify';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import { config } from '@/core/config';
import { WorkerPool } from '@/core/worker/objects/instance';
import nextConfig from '@/next.config';
import { safePath } from '@/shared/lib/safePath';

(async () => {
    const server = Fastify({
        logger: true,
        pluginTimeout: config.isDevelopment ? 120_000 : undefined
    });

    server.s3 = new S3({
        region: 'auto',
        endpoint: config.awsEndpoint,
        credentials: {
            accessKeyId: config.awsAccessKeyId,
            secretAccessKey: config.awsSecretAccessKey
        }
    });

    server.workerPool = new WorkerPool();

    server
        .register(fastifyNext, {
            dev: config.isDevelopment,
            hostname: config.serverHostname,
            port: config.serverPort,
            conf: nextConfig
        })
        .after(() => {
            server.next('*', (app, req, reply) => {
                const handle = app.getRequestHandler();
                return handle(req.raw, reply.raw).then(() => {
                    reply.hijack();
                });
            });
        });

    server.post(
        '/api/getMovieLink',
        async (
            req: FastifyRequest<{
                Body: {
                    movieLink: string;
                    mkvAudioTrack?: number;
                };
            }>,
            reply
        ) => {
            if (
                !req.body ||
                (req.body && typeof req.body.movieLink !== 'string')
            ) {
                reply.code(400);
                return new Error('Missing movieLink or it malformed');
            }

            const parsedPath = path.parse(safePath(req.body.movieLink));
            if (parsedPath.root === '') {
                reply.code(400);
                return new Error('movieLink is not a path');
            }

            if (
                !config.moviesPath.includes(parsedPath.dir) &&
                !config.isDevelopment
            ) {
                reply.code(401);
                return new Error('movieLink is not allowed path');
            }

            try {
                await fs.access(req.body.movieLink);
            } catch (exc) {
                reply.code(400);
                return new Error('something wrong with link');
            }

            const hex = crypto
                .createHash('md5')
                .update(req.body.movieLink)
                .digest('hex');

            if (server.workerPool.IsWorkerInProgress(hex)) {
                reply.send({
                    state: 'in_progress',
                    link: null
                });
                return;
            }

            let receivedObject: GetObjectCommandOutput | undefined;
            try {
                receivedObject = await server.s3.getObject({
                    Bucket: config.awsBucket,
                    Key: `${hex}/content.m3u8`
                });
            } catch (_) {}

            if (receivedObject) {
                reply.send({
                    state: 'link',
                    link: `${config.awsPublicProxy}/${hex}/content.m3u8`
                });
                return;
            }

            server.workerPool.spawnWorker(
                hex,
                req.body.movieLink,
                req.body.mkvAudioTrack
            );
            reply.send({
                state: 'in_progress',
                link: null
            });
        }
    );

    server.post(
        '/api/truncMovie',
        async (
            req: FastifyRequest<{
                Body: {
                    movieLink: string;
                };
            }>,
            reply
        ) => {
            if (
                !req.body ||
                (req.body && typeof req.body.movieLink !== 'string')
            ) {
                reply.code(400);
                return new Error('Missing movieLink or it malformed');
            }

            const parsedPath = path.parse(safePath(req.body.movieLink));
            if (parsedPath.root === '') {
                reply.code(400);
                return new Error('movieLink is not a path');
            }

            if (
                !config.moviesPath.includes(parsedPath.dir) &&
                !config.isDevelopment
            ) {
                reply.code(401);
                return new Error('movieLink is not allowed path');
            }

            try {
                await fs.stat(req.body.movieLink);
            } catch (exc) {
                reply.code(400);
                return new Error('something wrong with link');
            }

            const hex = crypto
                .createHash('md5')
                .update(req.body.movieLink)
                .digest('hex');

            const listedObjects = await server.s3.listObjectsV2({
                Bucket: config.awsBucket,
                Prefix: `${hex}`
            });

            if (listedObjects.Contents?.length === 0)
                return reply.send({
                    done: false
                });

            const deleteParams = {
                Bucket: config.awsBucket,
                Delete: { Objects: [] }
            };

            listedObjects.Contents?.forEach(({ Key }) => {
                // @ts-ignore
                deleteParams.Delete.Objects.push({ Key });
            });

            await server.s3.deleteObjects(deleteParams);

            return reply.send({
                done: true
            });
        }
    );

    // Run the server!
    server.listen(
        { host: config.serverIP, port: config.serverPort },
        (err, address) => {
            if (err) {
                server.log.error(err);
                process.exit(1);
            }

            server.log.info(`Server is now listening on ${address}`);
        }
    );
})();
