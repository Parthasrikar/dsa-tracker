import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

async function clearCache() {
    if (!REDIS_URL) {
        console.log('No Redis URL configured. Cache is disabled.');
        return;
    }

    const redis = new Redis(REDIS_URL);

    try {
        console.log('Clearing Redis cache...');
        await redis.flushdb();
        console.log('✓ Redis cache cleared successfully!');
    } catch (error) {
        console.error('Error clearing cache:', error);
    } finally {
        await redis.quit();
    }
}

clearCache();
