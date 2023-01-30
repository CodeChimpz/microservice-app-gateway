import {app} from "./app.js";
import {config} from "dotenv";
import {io} from "./socket.js";


config()
const {PORT, SOCKET_PORT} = process.env

app.listen(PORT, () => {
    console.log('Listening on ' + PORT)
    io.listen(Number(SOCKET_PORT), {})
    console.log('Socket listening on ' + SOCKET_PORT)
})
