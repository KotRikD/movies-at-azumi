import dotenv from 'dotenv';

dotenv.config();

export const config = {
    isDevelopment: process.env.NODE_ENV === 'development',

    serverHostname: process.env.SERVER_HOSTNAME || 'http://localhost',
    serverIP: process.env.SERVER_IP || '127.0.0.1',
    serverPort: Number(process.env.SERVER_PORT || '3000'),

    moviesPath: process.env.MOVIES_PATH || '',

    awsPublicProxy: process.env.AWS_PUBLIC_PROXY || '',
    awsBucket: process.env.AWS_BUCKET || '',
    awsEndpoint: process.env.AWS_ENDPOINT || '',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
};
