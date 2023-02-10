import {RateLimiterRedis} from "rate-limiter-flexible";
import {Request, Response} from "express";
import {Socket} from "socket.io";
import {logger} from "./logger-init.js";
import {SessionCache as redis} from './redis.js'
import {DefaultEventsMap} from "socket.io/dist/typed-events";

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
    } catch (e: any) {
        logger.app.error('rate limit exceeded ', {address: socket.handshake.address, details: e})
        socket.disconnect()
    }
}



