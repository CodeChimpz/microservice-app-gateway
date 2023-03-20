import {config} from "dotenv";
import mock from './mock-data.json';
//makes an api call to check ip range the ip belongs to and returns regional metadata
//mock implementation
export class IpRangeChecker<TResponse> {
    api_endpoint: string

    constructor(api_endpoint: string) {
        this.api_endpoint = api_endpoint
    }

    async get(ip: string) {
        //mock
        return mock
    }
}

config()
export const ipRangeScraper = new IpRangeChecker(String(process.env.IP_RANGE_API_ENDPOINT))