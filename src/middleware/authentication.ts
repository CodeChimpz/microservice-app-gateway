import {Server, Socket} from "socket.io";
import jwt from 'jsonwebtoken'
import {config} from "dotenv";
import {logger} from "../init/logger.js";
import {Request} from "express";
import * as http from "http";

config()

export async function authJWTExpress(req: http.IncomingMessage, res: http.ServerResponse, next: any) {
    try {
        const auth = req.headers.authorization
        if (!auth) {
            next('Not authenticated')
            return
        }
        const token = auth.split('Bearer ')[0]
        const verified_ = await jwt.verify(token, String(process.env.JWT_SECRET));
        (req as any).id = (verified_ as any)._id
        next()
    } catch (e: any) {
        logger.http.error(e)
        next('Not authenticated')
    }
}

export async function authJWTSocket(socket: Socket<any, any, any, any>, next: any) {
    try {
        const auth = socket.handshake.headers.authorization
        if (!auth) {
            next()
            return
        }
        const token = auth.split(' ')[1].replaceAll('\"','')
        const verified_ = await jwt.verify(token, String(process.env.JWT_SECRET));
        socket.auth = (verified_ as any)._id
        next()
    } catch (e: any) {
        logger.http.error(e)
        next('Not authenticated')
    }
}