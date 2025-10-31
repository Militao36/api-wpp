import { DateTime } from 'luxon'
import { randomUUID } from 'crypto'
import { ConversationEntity, StatusConversation } from '../entity/ConversationEntity'
import { ConversationMessageEntity } from '../entity/ConversationMessageEntity'
import { ConversationUserEntity } from '../entity/ConversationUserEntity'
import { ConversationMessageRepository } from '../repositories/ConversationMessageRepository'
import { ConversationRepository } from '../repositories/ConversationRepository'
import { ConversationUsersRepository } from '../repositories/ConversationUsersRepository'
import { BadRequestExeption } from '../util/exceptions/BadRequest'
import { ClientsWpp } from '../wpp'
import { ContactService } from './ContactService'
import { UserService } from './UserService'
import { AwsService } from './AwsService'
import { io } from '../server'
import { UserEntity } from '../entity/UserEntity'
import _ from 'lodash'

export class ConversationService {
  #conversationRepository: ConversationRepository
  #conversationUsersRepository: ConversationUsersRepository
  #conversationMessageRepository: ConversationMessageRepository
  #userService: UserService
  #contactService: ContactService
  #clientsWpp: ClientsWpp
  #awsService: AwsService

  constructor({ awsService, userService, contactService, clientsWpp, conversationRepository, conversationUsersRepository, conversationMessageRepository }) {
    this.#conversationRepository = conversationRepository
    this.#conversationUsersRepository = conversationUsersRepository
    this.#conversationMessageRepository = conversationMessageRepository
    this.#contactService = contactService
    this.#clientsWpp = clientsWpp
    this.#userService = userService
    this.#awsService = awsService
  }

  public async save(conversation: ConversationEntity): Promise<string> {
    const conversationData = new ConversationEntity(conversation)

    await this.#conversationRepository.save(conversationData)

    for await (const item of (conversation?.users ?? [])) {
      await this.#conversationUsersRepository.save(new ConversationUserEntity({
        idUser: item.id,
        idConversation: conversationData.id!,
        idEmpresa: conversation.idEmpresa
      }))
    }

    if (conversation?.users?.length) {
      await this.emitConversationByUser(conversationData.id!, conversation.idEmpresa, conversation.users)
    }

    if (!conversation?.users?.length) {
      await this.emitConversationByUser(conversationData.id!, conversation.idEmpresa)
    }

    return conversationData.id!
  }

  public async removeAndAddUsers(idUserLogged: string, idEmpresa: string, conversationUser: ConversationUserEntity[]) {
    const conversation = await this.findById(conversationUser[0].idConversation, idEmpresa)

    const usersConverstion = await this.#conversationUsersRepository.findByConversation(conversationUser[0].idConversation, idEmpresa)

    const idsUsersNew = conversationUser.map(e => e.idUser)

    const usersToRemove = usersConverstion.filter(e => !idsUsersNew.includes(e.idUser) && !e.isMaster)

    for (const item of usersToRemove) {
      await this.#conversationUsersRepository.delete(item.id, item.idEmpresa)
    }

    const idsUsersOld = usersConverstion.map(e => e.idUser)

    const usersToAdd = conversationUser.filter(e => !idsUsersOld.includes(e.idUser))

    for await (const item of usersToAdd) {
      await this.#conversationUsersRepository.save(new ConversationUserEntity({
        idUser: item.idUser,
        idConversation: item.idConversation,
        idEmpresa: item.idEmpresa
      }))
    }

    await this.#conversationRepository.update({
      status: StatusConversation.OPEN,
    } as ConversationEntity, conversation.id!, idEmpresa)

    await this.addAndRemoveUsers(conversationUser[0].idConversation, idUserLogged, idEmpresa)
  }

  public async message(
    conversationMessage: Partial<ConversationMessageEntity &
    { fileName: string, mimetype: string, idContact: string }>
  ): Promise<ConversationMessageEntity> {
    const conversation = await this.findById(conversationMessage.idConversation, conversationMessage.idEmpresa)

    if (conversation.status === StatusConversation.CLOSED) {
      throw new BadRequestExeption('Conversa finalizada, não é possível enviar mensagens')
    }

    const contact = await this.#contactService.findById(
      conversationMessage.idEmpresa,
      conversation.idContact
    )

    conversationMessage.idConversation = conversation.id!

    let isMessageSend = null
    let chatId = await this.formatChatId(conversationMessage.idEmpresa, contact.phone)

    if (!conversationMessage.hasMedia) {
      isMessageSend = await this.#clientsWpp.sendMessage(contact.idEmpresa, {
        chatId,
        message: conversationMessage.message
      })

      conversationMessage.file = ''
      conversationMessage.mimetype = ''
      conversationMessage.fileName = ''
    }

    if (conversationMessage.hasMedia) {
      if (
        !conversationMessage?.mimetype ||
        !conversationMessage?.file
      ) {
        throw new BadRequestExeption('Campos obrigatórios não informado (base64, file).')
      }

      const imagesMimetypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

      if (imagesMimetypes.includes(conversationMessage.mimetype!)) {
        isMessageSend = await this.#clientsWpp.sendMessageImage(contact.idEmpresa, {
          chatId,
          caption: conversationMessage.message,
          base64: conversationMessage.file,
          mimetype: conversationMessage.mimetype,
          fileName: conversationMessage.fileName
        })
      }

      const videoMimetypes = ['video/mp4', 'video/3gp', 'video/avi', 'video/mov', 'video/mkv']

      if (videoMimetypes.includes(conversationMessage.mimetype!)) {
        isMessageSend = await this.#clientsWpp.sendMessageVideo(contact.idEmpresa, {
          chatId,
          caption: conversationMessage.message,
          base64: conversationMessage.file,
          mimetype: conversationMessage.mimetype,
          fileName: conversationMessage.fileName
        })
      }

      const documentsMimetypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf',
        'text/plain',
        'application/rtf',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.oasis.opendocument.presentation',
        'application/json',
        'application/xml',
        'application/x-yaml',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/pdfa'
      ]

      if (documentsMimetypes.includes(conversationMessage.mimetype!)) {
        isMessageSend = await this.#clientsWpp.sendMessageFile(contact.idEmpresa, {
          chatId,
          caption: conversationMessage.message,
          base64: conversationMessage.file,
          mimetype: conversationMessage.mimetype,
          fileName: conversationMessage.fileName
        })
      }

      ///oga

      const audioMimetypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/flac',
        'audio/mp4',
        'audio/3gp',
        'audio/amr',
        'audio/oga',
        'audio/webm'
      ]

      if (audioMimetypes.includes(conversationMessage.mimetype!)) {
        isMessageSend = await this.#clientsWpp.sendMessageAudio(contact.idEmpresa, {
          chatId,
          base64: conversationMessage.file,
          mimetype: conversationMessage.mimetype,
          fileName: conversationMessage.fileName
        })
      }


      const { url } = await this.#awsService.uploadFileBase64(
        conversationMessage.file,
        `${randomUUID()}.${conversationMessage.fileName.split('.').pop()}`,
        'chat-media'
      )

      conversationMessage.file = url
    }

    if (!isMessageSend) {
      throw new BadRequestExeption('Erro ao enviar mensagem')
    }

    const conversationMessageData = new ConversationMessageEntity(conversationMessage)

    await this.#conversationMessageRepository.save(conversationMessageData)

    await this.update(conversationMessage.idConversation, conversationMessage.idEmpresa, {
      lastMessage: conversationMessage.message,
      isRead: true,
      status: StatusConversation.OPEN
    })

    return {
      ...conversationMessageData,
      createdAt: DateTime.fromSQL(conversationMessageData.createdAt!).toISO(),
      updatedAt: DateTime.fromSQL(conversationMessageData.updatedAt!).toISO(),
    }
  }

  public async addMessage(idEmpresa: string, idConversation: string, idUser: string, message: string, messageId: string, hasMedia: boolean, url: string) {
    const conversationData = new ConversationMessageEntity({
      idEmpresa: idEmpresa,
      idConversation: idConversation,
      idUser: idUser,
      message: message || null,
      messageId,
      hasMedia: hasMedia,
      file: hasMedia ? url : '',
    })

    try {
      if (hasMedia && url) {
        const result = await this.#awsService.uploadFile(url, `${conversationData.id}.${url.split('.').pop()}`, 'chat-media')

        conversationData.file = result.url;
      }
    } catch (error) {
      console.log('Erro ao fazer upload do arquivo para o S3', error);
    }

    await this.#conversationMessageRepository.save(conversationData)

    await this.updateLastMessage(
      idConversation,
      idEmpresa,
      (hasMedia ? conversationData.file : message)
    )

    await this.#conversationRepository.update({
      isRead: false,
      updatedAt: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
    }, idConversation, idEmpresa)

    await this.emitNewMessage(idConversation, conversationData.id!, idEmpresa, idUser)
  }

  public async findAll(idEmpresa: string, idUser: string, filter?: Record<string, any>): Promise<ConversationEntity[]> {
    try {
      const data = []
      const user = await this.#userService.findById(idUser, idEmpresa)

      const conversations = await this.#conversationRepository.findAllConversationByUser(idEmpresa, user.isMaster ? null : idUser, filter)

      for await (const conversation of conversations) {
        const conversationUsers = await this.#conversationUsersRepository.findByConversation(conversation.id, idEmpresa, { users: true })

        data.push({
          ...conversation,
          users: conversationUsers.map(e => {
            return {
              id: e.id,
              idConversation: e.idConversation,
              idUser: e.idUser,
              name: e.name,
              username: e.username,
              isMaster: e.isMaster
            }
          })
        })
      }

      return data
    } catch (error) {
      return []
    }
  }

  async countConversationsByStatus(idEmpresa: string, status: StatusConversation[]) {
    const data = this.#conversationRepository.countConversationsByStatus(idEmpresa, status)

    return data
  }

  async findById(id: string, idEmpresa: string): Promise<ConversationEntity> {
    const conversation = await this.#conversationRepository.findById(id, idEmpresa)

    if (!conversation) {
      throw new BadRequestExeption('Conversa não encontrada')
    }

    return conversation as ConversationEntity
  }

  public async transfer(idEmpresa: string, idUserLogged: string, idUserTransfer: string, conversationId: string, trasnferMessges: boolean): Promise<void> {
    const userLogged = await this.#userService.findById(idUserLogged, idEmpresa)

    if (!userLogged.isMaster) {
      throw new BadRequestExeption('Usuário sem permissão para transferir conversa')
    }

    await this.#userService.findById(idUserTransfer, idEmpresa)

    const conversation = await this.findById(conversationId, idEmpresa)

    if (!trasnferMessges) {
      conversation.finishedAt = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
      conversation.isRead = true
      conversation.status = StatusConversation.CLOSED

      await this.#conversationRepository.update(conversation, conversation.id!, idEmpresa)

      // cria uma nova conversa com aquele usuario
      const { id } = await this.findOrCreateConversation(idEmpresa, conversation.idContact, idUserTransfer)

      await this.removeAndAddUsers(idUserLogged, idEmpresa, [
        {
          idUser: idUserTransfer,
          idConversation: id,
          idEmpresa
        }
      ])

      await this.#conversationRepository.update({
        status: StatusConversation.OPEN,
      } as ConversationEntity, id, idEmpresa)

      return
    }

    await this.removeAndAddUsers(idUserLogged, idEmpresa, [
      {
        idUser: idUserTransfer,
        idConversation: conversation.id!,
        idEmpresa
      }
    ])
  }

  public async listMessages(idEmpresa: string, idConversation: string, page: number) {
    const conversation = await this.findById(idConversation, idEmpresa)

    await this.#conversationRepository.update({ isRead: true }, conversation.id, idEmpresa)

    const messages = await this.#conversationMessageRepository
      .findAllPaginationWithConversationIdUser(
        idEmpresa,
        conversation.id,
        page
      )

    return messages
  }

  public async updateLastMessage(idConversation: string, idEmpresa: string, lastMessage: string) {
    await this.#conversationRepository.update({
      lastMessage,
      isRead: true,
    }, idConversation, idEmpresa)
  }

  public async update(idConversation: string, idEmpresa: string, data: Partial<ConversationEntity>) {
    await this.#conversationRepository.update(data as ConversationEntity, idConversation, idEmpresa)
  }

  public async updateRead(idConversation: string, idEmpresa: string) {
    await this.#conversationRepository.update({
      isRead: true
    }, idConversation, idEmpresa)
  }

  public async findConversationByContactNotFinished(idEmpresa: string, idContact: string) {
    return this.#conversationRepository
      .findConversationByContactNotFinished(idEmpresa, idContact)
  }

  async listUsersInConversation(idConversation: string, idEmpresa: string) {
    return this.#conversationUsersRepository.findByConversation(idConversation, idEmpresa, { users: true })
  }

  async findOrCreateConversation(idEmpresa: string, idContact: string, idUser: string) {
    let conversation = await this.findConversationByContactNotFinished(idEmpresa, idContact)

    if (!conversation) {
      const user = await this.#userService.findById(idUser, idEmpresa)

      const idConversation = await this.save({
        idEmpresa,
        idContact,
        isRead: false,
        idSector: user.idSector || null,
        users: [
          {
            id: idUser,
          }
        ]
      })

      conversation = await this.findById(idConversation, idEmpresa)
    }

    return conversation
  }

  async finishConversation(idEmpresa: string, id: string) {
    const conversation = await this.findById(id, idEmpresa)

    if (!conversation) {
      throw new BadRequestExeption('Conversa não encontrada')
    }

    conversation.finishedAt = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
    conversation.status = StatusConversation.CLOSED
    conversation.isRead = true

    await this.#conversationRepository.update(conversation, conversation.id!, idEmpresa)
  }

  async formatChatId(nameConnection: string, chatId: string) {
    try {
      const _chatId = await this.#clientsWpp.numberExists(nameConnection, chatId)

      return _chatId.substring(2).replace('@c.us', '')

    } catch (error) {
      return chatId.replace(/^(\d{2})9(\d{8})$/, '$1$2')
    }
  }

  // sockets emitters
  private async emitConversationByUser(idConversation: string, idEmpresa: string, usersIncludes: Partial<UserEntity>[] = []) {
    const users = await this.#userService.findMasterUsersByIdEmpresa(idEmpresa)
    const sockets = await this.getSocketByEmpresa(idEmpresa)

    const allUsers = _.uniqBy([...users, ...usersIncludes], 'id')

    for await (const socket of sockets) {
      if (allUsers.find(e => e.id === socket.data.idUser)) {
        socket.join(idConversation);

        const conversaitons = await this.findAll(idEmpresa, socket.data.idUser, { ids: [idConversation] })

        socket.emit("new-conversation", {
          conversation: conversaitons[0],
        });
      }
    }
  }

  private async addAndRemoveUsers(idConversation: string, idUserLogged: string, idEmpresa: string) {
    const sockets = await this.getSocketByEmpresa(idEmpresa)

    const conversationUsers = await this.#conversationUsersRepository.findByConversation(idConversation, idEmpresa)

    const conversation = await this.findById(idConversation, idEmpresa)

    for await (const socket of sockets) {
      if (
        conversationUsers.some(u => u.idUser === socket.data.idUser) &&
        socket.data.idUser !== idUserLogged
      ) {
        socket.join(idConversation);

        const users = conversationUsers.map(e => {
          return new UserEntity({
            name: e.name,
            username: e.username,
            isMaster: e.isMaster,
            idEmpresa,
            password: undefined,
          }, e.id)
        });

        socket.emit("add-user-conversation", {
          users,
          conversation
        });
      }
    }
  }

  private async emitNewMessage(idConversation: string, id: string, idEmpresa: string, idUser?: string) {
    const sockets = await this.getSocketByEmpresa(idEmpresa)

    if (idUser) {
      const conversationUsers = await this.#conversationUsersRepository.findByConversation(idConversation, idEmpresa)

      for await (const socket of sockets) {
        if (
          conversationUsers.find(u => u.idUser === socket.data.idUser) &&
          socket.data.idUser !== idUser
        ) {
          socket.join(idConversation);

          socket.emit('new-message', {
            message: await this.#conversationMessageRepository.findById(id, idEmpresa),
          });
        }
      }
    }

    if (!idUser) {
      for (const socket of sockets.filter(s => s.rooms.has(idConversation))) {
        socket.emit('new-message', {
          message: await this.#conversationMessageRepository.findById(id, idEmpresa),
        });
      }
    }
  }

  private async getSocketByEmpresa(idEmpresa: string) {
    const sockets = await io.fetchSockets();

    return sockets.filter(s => s.data.idEmpresa === idEmpresa)
  }
}