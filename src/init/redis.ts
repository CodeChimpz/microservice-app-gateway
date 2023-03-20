import {config} from "dotenv";
import {Redis} from "ioredis";

config()

export const SessionCache = new Redis(String(process.env.REDIS_URL_SERVICE_CACHE), {enableOfflineQueue: false})

export const AppCache = new Redis(String(process.env.REDIS_URL_APP_CACHE))
