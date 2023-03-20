import {Socket} from "socket.io";
import {logger} from "../init/logger.js";
import config from '../config.json';
import {ipRangeScraper} from "../util/ipRange.scraper";

export async function ipRangeBlockMw(socket: Socket, next: any) {
    try {
        const ip = socket.handshake.address
        //check and get country data
        const banned_ = config.access.bannedIsoRegionNames
        const getRegion = await ipRangeScraper.get(ip)
        const ban_check = banned_.indexOf(getRegion.countryName)
        if (ban_check) {
            logger.app.error('Connected from banned ip range', {ip, country: getRegion})
            socket.disconnect()
        }
    } catch (e: any) {
        logger.app.error(e.message)
        socket.disconnect()
    }
}












