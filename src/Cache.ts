import {Redis} from "ioredis";
// import {RedisCache} from "redis-lru-cache";
import {AppCache as redis} from "./init/redis.js";
import {config} from "dotenv";
import {logger} from "./init/logger.js";

config()

//ioredis connection options
interface RedisOptions {
    path?: string
    options?: {}
}

//options to configure memory usage in redis
interface Options {
    maxmemory: number,
    maxmemory_pol: string,
    ttl?: number
}

//Data with an _id field
interface IdentifiableDataI {
    _id: string | number
}

//
function parseFromRedisMemInfo(param: string, info_mem: string): number {
    const mem_found = info_mem.slice(info_mem.search(param)).match(/[\d\w.]*(?=\r\n)/)
    if (!mem_found) {
        throw new Error('Redis info check fail')
    }
    const mem_stat = mem_found[0]
    //
    const metric = mem_stat.match(/[KMG]/)
    if (!metric) {
        return Number(mem_stat)
    }
    //todo: ENUM
    switch (metric[0]) {
        case 'K':
            return Number(mem_stat) * 1000
        case 'M':
            return Number(mem_stat) * 1000000
        case 'G':
            return Number(mem_stat) * 1000000000
        default:
            return Number(mem_stat)
    }
}

//returns if percentage of first value from second is bigger than a certain percentage
function getPercentsMemStat(stat1: number, stat2: number, critical: number) {
    return 100 - stat1 / (stat2 / 100) >= critical
}

export class RedisCacheManager {
    redis: Redis
    options: Options

    // lruclient: RedisCache

    constructor(url: string, connect_options: RedisOptions, options: Options, redis?: Redis) {
        this.redis = redis || new Redis(url, connect_options)
        this.options = options
    }

    async init() {
        const info_mem = await this.redis.info('memory')
        //get stats from redis info
        const used_mem_val = parseFromRedisMemInfo('used_memory', info_mem)
        const used_mem_start = parseFromRedisMemInfo('used_memory_startup', info_mem)
        //if used_memory is bigger than used_memory_startup by a sufficicent margin we won't attribute it to redis
        //onstartup memory expenses and later flush the mf if it is bigger than the defined maxmemory
        const occ_k = getPercentsMemStat(used_mem_start, used_mem_val, 5)
        if(used_mem_val >= this.options.maxmemory && occ_k) {
            await this.redis.flushall()
            logger.app.info('Flushed Cache')
        }
        if(used_mem_val >= this.options.maxmemory && !occ_k){
            throw new Error('Supplied param "maxmemory" for cache config is smaller than on startup memory usage, please reconsider')
        }
        await this.redis.config('SET', 'maxmemory', this.options.maxmemory)
        await this.redis.config('SET', 'maxmemory-policy', this.options.maxmemory_pol)
    }

    //sets data for  key "token + id value of object in payload"
    async put(token: string, data: IdentifiableDataI) {
        const id = token + data._id
        const to_set = JSON.stringify(data)
        const res = await this.redis.set(id, to_set)
        if (this.options.ttl) {
            await this.redis.expire(id, String(this.options.ttl))
        }
        return res
    }

    //
    async get(token: string, id_obj: IdentifiableDataI) {
        const id = id_obj._id
        return this.redis.get(token + id)
    }
}

const OPTS = {
    maxmemory: 1100000,
    maxmemory_pol: 'allkeys-lru',
    ttl: 24 * 60 * 60 * 60
}
export const redisCache = new RedisCacheManager('', {}, OPTS, redis)
await redisCache.init()