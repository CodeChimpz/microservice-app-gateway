import express, {json, Request, Response} from 'express'
import {EndpointObject} from 'service-to-server'
import {config} from "dotenv";


config()
//todo : 1) make into map 2) put into express App
const API: { [key: string]: any } = {}
export const app = express()
//middleware
app.use(json())
//routing
app.post('/endpoint-registration', (req: Request, res: Response) => {
    const {service, auth, endpoints} = req.body
    //api key check mb ??
    //endpoint registration
    Object.entries(endpoints).forEach(entry => {
        const [method, endpoints_] = entry
        Object.entries(endpoints_ as EndpointObject).forEach(entry_ => {
            const [route, endpoint] = entry_
            API[endpoint] = {route, method}
        })
    })
    res.sendStatus(200)
})
app.get('/API', (req: Request, res: Response) => {
    console.log(API)
    res.json(API)
})
