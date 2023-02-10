import {WinstonLoggerService} from "mein-winston-logger";

export const logger = new WinstonLoggerService({console: true, maxsize: 40000})