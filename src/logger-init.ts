import {WinstonLoggerService} from "logger";

export const logger = new WinstonLoggerService({path: './logs', console: true, maxsize: 40000})