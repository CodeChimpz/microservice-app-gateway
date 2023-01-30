import {Server} from "socket.io";
import {app} from "./app.js";
import * as http from "http";
import axios from "axios";
import {logger} from "./logger-init.js";
import {redis} from "./redis.js";

const session = redis
const server = http.createServer(app)
export const io = new Server(server)

io.on('connection', (socket) => {
    logger.http.info('New client connected')
    //redirect socket event to microservice endpoint
    socket.on('access-endpoint', async (token, data, callback) => {
        console.log(token)
        const url = await session.get(token)
        console.log(url)
        const response = await axios.post('http://' + url, data, {})
        //todo: how tf do i redirect inside service
        //testing purposes
        socket.emit('response', response.data)
        // callback(response)
    })
})