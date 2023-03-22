import {RateLimiterRedis} from "rate-limiter-flexible";
import {Socket} from "socket.io";
import {logger} from "../init/logger.js";
import config from '../config.json' assert {type: 'json'};
import {Ban, ConnectionRateLimiter, SessionRateLimiter} from "../init/redis.js";

const MAX_B4_BAN = Number(config.access.MAX_SUS_BEFORE_BAN)

export function limiterFactory(limiter: RateLimiterRedis) {
    return async function connectionRateLimiter(socket: Socket, next: any) {
        try {
            const banned_ = await Ban.get(socket.handshake.address)
            //check if banned
            if (!banned_?.remainingPoints) {
                logger.http.error('attempt banned ', {address: socket.handshake.address})
                socket.disconnect()
                next('attempt banned')
                return
            }
            await ConnectionRateLimiter.consume(socket.handshake.address, 1)
            next()
        } catch (e) {
            logger.http.error('rate limit exceeded ', {address: socket.handshake.address, details: e})
            //add suspicion to the ip , high suspicion will result in banning the user for an extended period of time
            socket.disconnect()
            try {
                await Ban.consume(socket.handshake.address, 1)
            } catch (e) {
                logger.http.error('banned ip', {address: socket.handshake.address})
            }
            next(e)
        }
    }
}







