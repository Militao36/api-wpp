import jwt from 'jsonwebtoken'

import { type Server } from 'socket.io'
import container from '../container'
import { ConversationService } from '../services/ConversationService'

export function authSocket(io: Server) {
  io.use((socket, next) => {

    socket.data = {
      ...socket.data,
      idEmpresa: '1',
      idUser: process.env.ID_USER
    }

    next()
    // const auth = socket.handshake.headers.authorization

    // if (!auth) {
    //   return next(new Error('Token de autenticação não fornecido'))
    // }

    // const token = auth.split(' ')[1]

    // jwt.verify(token, process.env.SECRET_JWT, async (err, decoded: any) => {
    //   if (err) {
    //     return next(new Error('Falha na autenticação do token'))
    //   }

    //   socket.data = {
    //     ...socket.data,
    //     idEmpresa: '1',
    //     idUser: process.env.ID_USER
    //   }

    //   next()
    // })
  })
}

export function startSocket(io: Server) {
  io.on('connection', async (socket) => {
    const { idEmpresa, idUser } = socket.data

    const conversations = await container.resolve<ConversationService>('conversationService').findAll(
      idEmpresa,
      idUser,
    )

    conversations.forEach((conversation) => {
      socket.join(conversation.id)
    })

    socket.emit('preload-conversations', {
      conversations,
    })

    socket.on('disconnect', (socket) => {
      console.log('Client disconnected', socket)
    })
  })
}
