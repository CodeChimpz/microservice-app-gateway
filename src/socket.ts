import {Server, Socket} from "socket.io";
import * as http from "http";
import axios from "axios";
import {logger} from "./init/logger.js";
import {limiterFactory} from "./middleware/rate-limiter.js";
import {redisCache} from "./Cache.js";
import {response} from "express";
import express from 'express'
import {registry} from "./init/service-registry.js";
import {ConnectionRateLimiter, SessionRateLimiter} from "./init/redis.js";
import {ipRangeBlock} from "./middleware/ip-range.js";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {authJWTExpress, authJWTSocket} from "./middleware/authentication.js";
//
// const session = redis
const server = http.createServer(express())
//Server init
export const io = new Server(server, {transports: ['polling', 'websocket']})
//MIDDLEWARE
io.use(ipRangeBlock)
//rate limiter for connections
io.use(limiterFactory(ConnectionRateLimiter))
//auth on socket handshake
io.use(authJWTSocket)
//LONG POLLING EXPRESS MIDDLEWARE
//rate limiter for in-session requests
io.engine.use((req, res, next) => limiterFactory(SessionRateLimiter)(req.socket as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, next))
io.engine.use(authJWTExpress)
//Server and socket events handling
io.on('connection', (socket) => {
    logger.http.info('New client connected ' + socket.handshake.address)
    //redirect socket event to microservice endpoint
    socket.on('access-endpoint', async (token, data, callback) => {
        try {
            //get the address of the service endpoint
            const url = await registry.route(token)
            //handle request redirection
            const [action] = token.split('.').slice(-1)
            const [route_key] = token.split(action)
            //handle caching logic
            //for create/update type actions ".post/.put in token" - require service to send back data for w-through caching
            let require_cache = false
            switch (action) {
                case 'post':
                    logger.app.debug('Cache write initiated')
                    require_cache = true
                    break;
                case 'get':
                    //get from cache
                    const cached = await redisCache.putResult(route_key, data)
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
            const response = await axios.post(url, {
                data,
                require_cache,
                _id: socket.auth
            }, {})
            //testing purposes
            socket.emit('response', response.data)
            // callback(response)
            const to_cache = response.data.to_cache
            //Write to cache if specified earlier
            if (require_cache && to_cache) {
                await redisCache.putResult(route_key, to_cache)
            }
        } catch (e: any) {
            logger.app.error(e)
            if (e.response?.status <= 400) {
                socket.emit('response', {error: e.response.data, status: e.response.status})
            } else {
                socket.emit('response', {error: 'Server error', status: 500})
            }
            //callback(error)
        }
    })
})
