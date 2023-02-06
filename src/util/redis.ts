import {config} from "dotenv";
import {Redis} from "ioredis";

config()

export const redis = new Redis(String(process.env.REDIS_URL), {enableOfflineQueue: false})

