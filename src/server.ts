import 'dotenv/config'
import http from 'http'
import app from './app'
import { Server } from 'socket.io'
import { authSocket, startSocket } from './socket-io'

const server = http.createServer(app)

export const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

startSocket(io)

authSocket(io)

server.listen(process.env.PORT, () => {
  console.log(`http://localhost:${process.env.PORT}`)
})
