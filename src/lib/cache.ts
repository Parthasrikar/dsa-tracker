import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

declare global {
    // eslint-disable-next-line no-var
    var redisGlobal: Redis | undefined;
}

let redis: Redis | null = null;

if (REDIS_URL) {
    try {
        const options = {
            maxRetriesPerRequest: 1,
            retryStrategy: (times: number) => {
                if (times > 3) return null; // stop processing retry after 3 times
                return Math.min(times * 50, 2000);
            }
        };

        if (process.env.NODE_ENV === 'production') {
            redis = new Redis(REDIS_URL, options);
        } else {
            if (!global.redisGlobal) {
                global.redisGlobal = new Redis(REDIS_URL, options);
            }
            redis = global.redisGlobal;
        }

        // Only attach listeners if they haven't been attached yet to avoid spamming console
        if (redis && redis.listenerCount('error') === 0) {
            redis.on('error', (err) => {
                console.warn('Redis connection error:', err);
            });

            redis.on('connect', () => {
                console.log('Successfully connected to Redis');
            });
        }

    } catch (error) {
        console.warn('Failed to initialize Redis client:', error);
    }
} else {
    // Only log warning in development to avoid cluttering prod logs if intentionally disabled
    if (process.env.NODE_ENV !== 'production') {
        console.warn('REDIS_URL not found in environment variables. Caching will be disabled.');
    }
}

/**
 * Robust cache wrapper that uses Redis if available, 
 * falling back to direct execution if Redis is down or not configured.
 */
export async function getOrSetCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
): Promise<T> {
    if (!redis) {
        return fetcher();
    }

    try {
        const cachedData = await redis.get(key);

        if (cachedData) {
            return JSON.parse(cachedData) as T;
        }
    } catch (error) {
        console.warn(`Redis get error for key ${key}:`, error);
    }

    try {
        const data = await fetcher();

        if (data !== undefined && data !== null) {
            // Store in Redis without blocking
            redis.set(key, JSON.stringify(data), 'EX', ttlSeconds).catch(err => {
                console.warn(`Redis set error for key ${key}:`, err);
            });
        }

        return data;

    } catch (error) {
        throw error;
    }
}

/**
 * Invalidate cache for a specific key
 */
export async function invalidateCache(key: string): Promise<void> {
    if (!redis) return;

    try {
        await redis.del(key);
    } catch (error) {
        console.warn(`Redis delete error for key ${key}:`, error);
    }
}

/**
 * Invalidate cache by pattern (use carefully, expensive operation)
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
    if (!redis) return;

    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(keys);
        }
    } catch (error) {
        console.warn(`Redis pattern delete error for ${pattern}:`, error);
    }
}

export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
}
