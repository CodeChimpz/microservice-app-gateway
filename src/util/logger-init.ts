import {WinstonLoggerService} from "mein-winston-logger";

export const logger = new WinstonLoggerService({path: './logs', console: true, maxsize: 40000})