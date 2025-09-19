import { DateTime } from 'luxon'
import { randomUUID } from 'crypto'
import { ConversationEntity } from '../entity/ConversationEntity'
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
import type { TypesEventSocket } from '../socket-io/socketManager'
import { io } from '../server'
import { UserEntity } from '../entity/UserEntity'

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

      await this.emitiNewConversation(conversationData.id!, item.id!, conversation.idEmpresa)
    }

    return conversationData.id!
  }


  public async removeAndAddUsers(idUserLogged: string, idEmpresa: string, conversationUser: ConversationUserEntity[]) {
    const conversation = await this.findById(conversationUser[0].idConversation, idEmpresa)

    if (conversation.step) {
      throw new BadRequestExeption('Conversa em atendimento automático, não é possível alterar os usuários da conversa. Favor transferir a conversa para outro usuário.')
    }

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

    await this.addAndRemoveUsers(conversationUser[0].idConversation, idUserLogged, idEmpresa)
  }

  public async message(
    conversationMessage: Partial<ConversationMessageEntity &
    { fileName: string, mimetype: string, idContact: string }>
  ): Promise<ConversationMessageEntity> {
    const conversation = await this.findOrCreateConversation(conversationMessage.idEmpresa, conversationMessage.idContact!, conversationMessage.idUser!)

    if (conversation.step) {
      await this.update(conversation.id!, conversation.idEmpresa, { step: null })
      conversation.step = null;

      await this.removeAndAddUsers(conversation.id!, conversationMessage.idUser!, [])
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

      isMessageSend = await this.#clientsWpp.sendMessageImage(contact.idEmpresa, {
        chatId,
        caption: conversationMessage.message,
        base64: conversationMessage.file,
        mimetype: conversationMessage.mimetype,
        fileName: conversationMessage.fileName
      })

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

    await this.updateLastMessage(
      conversationMessage.idConversation,
      conversationMessage.idEmpresa,
      conversationMessage.message
    )

    await this.updateRead(
      conversationMessage.idConversation,
      conversationMessage.idEmpresa
    )

    await this.emitConversation(conversationMessage.idConversation, conversationMessageData.id!, conversationMessage.idEmpresa, conversationMessage.idUser)

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
      message: hasMedia ? null : message,
      messageId,
      hasMedia: hasMedia,
      file: hasMedia ? url : '',
    })

    await this.#conversationMessageRepository.save(conversationData)

    await this.updateLastMessage(
      idConversation,
      idEmpresa,
      message
    )

    await this.emitConversation(idConversation, conversationData.id!, idEmpresa, idUser)
  }

  public async findAll(idEmpresa: string, idUser: string, filter?: Record<string, any>): Promise<ConversationEntity[]> {
    try {
      const data = []
      const user = await this.#userService.findById(idUser, idEmpresa)

      const conversations = await this.#conversationRepository.findAllConversationByUser(idEmpresa, user.isMaster ? null : idUser, filter)

      for await (const conversation of conversations) {
        const conversationNotFisnihed = await this.#conversationRepository.findConversationByContactNotFinished(idEmpresa, conversation.idContact)

        const conversationUsers = await this.#conversationUsersRepository.findByConversation(conversationNotFisnihed.id, idEmpresa, { users: true })

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

    // essa regra é para caso a conversa esteja em atendimento automático, ai forço sair do atendimento automático
    if (conversation.step) {
      await this.update(conversation.id!, conversation.idEmpresa, { step: null })
      trasnferMessges = true
    }

    if (!trasnferMessges) {
      conversation.finishedAt = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
      conversation.isRead = true

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

  public async listMessages(idEmpresa: string, idUser: string, idContact: string, page: number) {
    const user = await this.#userService.findById(idUser, idEmpresa)

    const conversation = await this.findConversationByContactNotFinished(idEmpresa, idContact)

    await this.#conversationRepository.update({ isRead: true }, conversation.id, idEmpresa)

    const messages = await this.#conversationMessageRepository
      .findAllPaginationWithConversationIdUser(
        idEmpresa,
        idContact,
        (user.isMaster ? null : idUser),
        page
      )

    return messages
  }

  public async updateLastMessage(idConversation: string, idEmpresa: string, lastMessage: string) {
    await this.#conversationRepository.update({
      lastMessage,
      isRead: false
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
      const idConversation = await this.save({
        idEmpresa,
        idContact,
        isRead: false,
        users: [
          {
            id: idUser,
          }
        ]
      })

      conversation = await this.findById(idConversation, idEmpresa)

      await this.emitiNewConversation(idConversation, idUser, idEmpresa)
    }

    return conversation
  }

  async finishConversation(idEmpresa: string, idContact: string) {
    const conversation = await this.findConversationByContactNotFinished(idEmpresa, idContact)

    if (!conversation) {
      throw new BadRequestExeption('Conversa não encontrada')
    }

    conversation.finishedAt = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')

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

  async emitiNewConversation(idConversation: string, idUser: string, idEmpresa: string) {
    const sockets = await io.fetchSockets();

    for await (const socket of sockets) {
      if (socket.data.idUser === idUser) {

        socket.join(idConversation);

        socket.emit("new-conversation", {
          conversation: await this.findById(idConversation, idEmpresa)
        });
      }
    }
  }

  private async addAndRemoveUsers(idConversation: string, idUserLogged: string, idEmpresa: string) {
    const sockets = await io.fetchSockets();

    for await (const socket of sockets) {
      if (socket.data.idUser === idUserLogged) {

        socket.join(idConversation);

        const conversationUser = await this.#conversationUsersRepository.findByConversation(idConversation, idEmpresa, { users: true })

        const users = conversationUser.map(e => {
          return new UserEntity({
            name: e.name,
            username: e.username,
            isMaster: e.isMaster,
            idEmpresa,
            password: undefined,
          }, e.id)
        })

        socket.emit("add-user-conversation", {
          users,
          conversation: await this.findById(idConversation, idEmpresa)
        });
      }
    }
  }

  private async emitConversation(idConversation: string, id: string, idEmpresa: string, idUser?: string) {
    const sockets = await io.fetchSockets();

    for (const socket of sockets.filter(s => s.rooms.has(idConversation))) {
      if (socket.data.idUser !== idUser) {
        socket.emit('new-message', {
          message: await this.#conversationMessageRepository.findById(id, idEmpresa),
        });
      }
    }
  }
}