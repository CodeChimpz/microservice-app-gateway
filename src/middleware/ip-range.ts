import {Socket} from "socket.io";
import {logger} from "../init/logger.js";
import ipRangeCheck from 'ip-range-check'
import config from '../config.json' assert {type: 'json'};

export async function ipRangeBlock(socket: Socket, next: any) {
    try {
        const ip = socket.handshake.address
        //check and get country data
        const v4 = ip.substring(0, 7) === '::ffff:' ? ip.substring(7) : ip
        const response = ipRangeCheck(v4, config.access.bannedIpRanges)
        //
        if (response) {
            throw new Error('Banned ip : ' + ip)
        }
        next()
    } catch (e: any) {
        logger.http.error(e.message)
        socket.disconnect()
        next(e)
    }
}












