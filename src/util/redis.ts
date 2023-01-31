import {config} from "dotenv";
import {createClient} from "redis";

config()
export const redis = createClient({url: process.env.REDIS_URL})
await redis.connect()