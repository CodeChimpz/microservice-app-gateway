import express, {json, raw, Request, Response} from 'express'
import {config} from "dotenv";
import {logger} from "./util/logger-init.js";
import {redis} from "./util/redis.js";
import cors from 'cors'
import ORIGINS from "./config/origins.json" assert {type: "json"}

const session = redis
config()

export const app = express()
//middleware
app.use(json())
//cors
if (process.env.ENABLE_CORS) {
    app.use(cors({
        origin: function (requestOrigin, callback) {
            if (Object.values(ORIGINS).indexOf(String(requestOrigin)) !== -1) {
                callback(null, true)
            } else {
                callback(new Error('Origin not allowed by CORS'))
            }
        }
    }))
}

//routing
app.post('/endpoint-registration', async (req: Request, res: Response) => {
    try {
        // console.log('aa')
        const {service, auth, endpoints} = req.body
        //api key check mb ??
        //endpoint registration
        const origin = ORIGINS[service as keyof typeof ORIGINS]
        //
        logger.http.info('A service initiated syncing endpoints', {service, host: origin})
        //
        await Promise.all(Object.entries(endpoints).map(entry => {
            const [route, endpoint] = entry
            const key = service + '.' + endpoint
            const val = origin + route
            //
            logger.http.info(`Registered endpoint ${key} - ${val} `,)
            return session.set(key, val)
        }))
        res.status(200).json({message: "Registered endpoints successfully"})
    } catch (e: any) {
        logger.app.error(e)
        res.status(500).json({message: "Something failed while registering endpoints"})
    }
})

