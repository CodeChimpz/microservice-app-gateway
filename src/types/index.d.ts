declare global {
    declare module 'socket.io' {
        interface Socket {
            auth: string
        }
    }
}