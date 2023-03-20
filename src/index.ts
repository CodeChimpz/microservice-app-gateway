import {config} from "dotenv";
import {io} from "./socket.js";
import {logger} from "./init/logger.js";

config()
const {PORT, SOCKET_PORT} = process.env


io.listen(Number(SOCKET_PORT), {})
logger.app.info('Socket listening on ' + SOCKET_PORT)