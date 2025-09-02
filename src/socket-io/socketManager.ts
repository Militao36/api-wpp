// import { type Socket } from 'socket.io'
import { io } from '../server'

// const sockets = new Map<string, { socket: Socket, data: any }>()

// export function addSocket (id: string, socket: Socket) {
//   console.log('Novo cliente conectado:', socket.id)

//   sockets.set(id, {
//     socket,
//     data: socket.data
//   })
// }

// export function getSocket (id: string) {
//   return sockets.get(id)
// }

export type TypesEventSocket = 'new-message'

export function emitEventSocket (id: string, event: TypesEventSocket, data: any) {
  io.to(id).emit(event, data)
}

// export function removeSocket (id: string) {
//   console.log('Cliente desconectado:', id)
//   sockets.delete(id)
// }
