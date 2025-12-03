import { createClient } from 'redis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || '6379';
const redisUrl = `redis://${redisHost}:${redisPort}`;

const redisClient = createClient({
  url: redisUrl
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    try {
        await redisClient.connect();
        console.log(`Connected to Redis successfully at ${redisUrl}!`);
    } catch(err) {
        console.error(`Could not connect to Redis at ${redisUrl}:`, err);
    }
})();

export default redisClient;
