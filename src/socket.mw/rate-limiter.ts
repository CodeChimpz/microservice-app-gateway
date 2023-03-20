import {RateLimiterRedis} from "rate-limiter-flexible";
import {Socket} from "socket.io";
import {logger} from "../init/logger.js";
import {SessionCache as redis} from '../init/redis.js'

export const ShortRateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'short_rate_limiter',
    points: 5,
    duration: 1,
    blockDuration: 60,
    inMemoryBlockOnConsumed: 5,
    inMemoryBlockDuration: 1,
})

export async function shortRateLimiterMiddleware(socket: Socket, next: any) {
    try {
        await ShortRateLimiter.consume(socket.handshake.address, 1)
        next()
    } catch (e) {
        logger.app.error('rate limit exceeded ', {address: socket.handshake.address, details: e})
        socket.disconnect()
    }
}



