import {Server, Socket} from "socket.io";
import {app} from "./app.js";
import * as http from "http";
import axios from "axios";
import {logger} from "./util/logger-init.js";
import {SessionCache as redis} from "./util/redis.js";
import {shortRateLimiterMiddleware} from "./util/rate-limiter.js";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {redisCache} from "./util/Cache.js";
import {response} from "express";

const session = redis
const server = http.createServer(app)
export const io = new Server(server, {
    //didn't work with artillery + no reason to ditch polling
    // transports: ['websocket']
})
//mw
io.use(shortRateLimiterMiddleware)
//nig*a the type conversion is retarded
io.engine.use((req, res, next) => shortRateLimiterMiddleware(<Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>><unknown>req.socket, next))
io.on('connection', (socket) => {

    logger.http.info('New client connected ' + socket.handshake.address)
    //redirect socket event to microservice endpoint
    socket.on('access-endpoint', async (token, data, callback) => {
        try {
            //get the address of the service endpoint
            const url = await session.get(token)
            if (!url) {
                return socket.emit('response', {
                    error: 'Cannot get ' + token + ', no such endpoint found',
                    status: 404
                })
                //callback(error)
            }
            //handle request redirection
            const redirect_req = {data, require_cache: false}
            let cache_res: boolean = false
            //handle caching logic
            const [action] = token.split('.').slice(-1)
            const [route_key] = token.split(action)
            //for create/update type actions ".post/.put in token" - signal to service to send back data for w-through caching
            switch (action) {
                case 'put':
                case 'post':
                    logger.app.debug('Cache write initiated')
                    redirect_req.require_cache = true
                    cache_res = true
                    break;
                case 'get':
                    //get from cache
                    const cached = await redisCache.get(route_key, data)
                    if (!cached) {
                        //
                        logger.app.debug('Cache miss for : ' + token, data)
                        break;
                    }
                    //
                    logger.app.debug('Cache hit for : ' + token, data)
                    return socket.emit('response', 'Retrieved from cache', cached)
                // callback(response)
                //
            }
            //Send request to Service
            //WTF why doesn't the other catch{} get the AxiosError this is retarded
            const response = await axios.post(url, redirect_req, {})
            //testing purposes
            socket.emit('response', response.data.message, response.data.data)
            // callback(response)
            const to_cache = response.data.to_cache
            //Write to cache if specified earlier
            if (cache_res && to_cache) {
                await redisCache.put(route_key, to_cache)
            }
        } catch (e: any) {
            logger.app.error(e)
            socket.emit('response', {error: 'Server error', status: 500})
            //callback(error)
        }

    })

})
