import {config} from "dotenv";
import {Redis} from "ioredis";
import {RateLimiterRedis} from "rate-limiter-flexible";

config()

export const SessionCache = new Redis(String(process.env.REDIS_URL_SERVICE_CACHE), {enableOfflineQueue: false})
export const AppCache = new Redis(String(process.env.REDIS_URL_APP_CACHE))

//limits new socket conenctions
export const ConnectionRateLimiter = new RateLimiterRedis({
    storeClient: SessionCache,
    keyPrefix: 'conn_rate_limiter',
    points: 5,
    duration: 60,
    blockDuration: 60,
    inMemoryBlockOnConsumed: 5,
    inMemoryBlockDuration: 60,
})
//limtis requests on requests withtin a connection session
export const SessionRateLimiter = new RateLimiterRedis({
    storeClient: SessionCache,
    keyPrefix: 'sess_rate_limiter',
    points: 20,
    duration: 60,
    blockDuration: 60,
    inMemoryBlockOnConsumed: 20,
    inMemoryBlockDuration: 60,
})
//ban for a extended period of time
export const Ban = new RateLimiterRedis({
    storeClient: SessionCache,
    keyPrefix: 'ban',
    points: 5,
    duration: 86400,
    blockDuration: 7889238,
    inMemoryBlockOnConsumed: 5,
    inMemoryBlockDuration: 7889238,
})
