import {WinstonLoggerService} from "mein-winston-logger";

export const logger = new WinstonLoggerService({console: true, path: './logs', maxsize: 40000})