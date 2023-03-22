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
//


// const session = redis
const server = http.createServer(express())
//Server init
export const io = new Server(server, {})
//MIDDLEWARE

//rate limiter for connections
io.use(limiterFactory(ConnectionRateLimiter))
io.use(ipRangeBlock)
//rate limiter for in-session requests
io.engine.use((req, res, next) => limiterFactory(SessionRateLimiter))
//Server and socket events handling
io.on('connection', (socket) => {
    logger.http.info('New client connected ' + socket.handshake.address)
    //redirect socket event to microservice endpoint
    socket.on('access-endpoint', async (token, data, callback) => {
        try {
            //get the address of the service endpoint
            const url = await registry.route(token)
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
            //WTF why doesn't the other catch{} get the AxiosError this is retarded
            const response = await axios.post(url, redirect_req, {})
            //testing purposes
            socket.emit('response', response.data)
            // callback(response)
            const to_cache = response.data.to_cache
            //Write to cache if specified earlier
            if (cache_res && to_cache) {
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
