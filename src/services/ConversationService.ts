import { DateTime } from 'luxon'
import { randomUUID } from 'crypto'
import { ConversationEntity } from '../entity/ConversationEntity'
import { ConversationMessageEntity } from '../entity/ConversationMessageEntity'
import { ConversationUserEntity } from '../entity/ConversationUserEntity'
import { ConversationMessageRepository } from '../repositories/ConversationMessageRepository'
import { ConversationRepository } from '../repositories/ConversationRepository'
import { ConversationUsersRepository } from '../repositories/ConversationUsersRepository'
import { BadRequestExeption } from '../util/exceptions/BadRequest'
import { MessageID } from '../util/utils'
import { ClientsWpp } from '../wpp'
import { ContactService } from './ContactService'
import { UserService } from './UserService'
import { AwsService } from './AwsService'
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
    }

    return conversationData.id!
  }

  public async addUser(conversationUser: ConversationUserEntity[]) {
    for (const item of conversationUser) {
      await this.#conversationUsersRepository
        .deleteAllRelations(item.idConversation, item.idEmpresa)
    }

    for await (const item of conversationUser) {
      await this.#conversationUsersRepository.save(new ConversationUserEntity({
        idUser: item.idUser,
        idConversation: item.idConversation,
        idEmpresa: item.idEmpresa
      }))
    }
  }

  public async message(conversationMessage: Partial<ConversationMessageEntity & { fileName: string, mimetype: string, idContact: string }>): Promise<string> {
    const conversation = await this.findOrCreateConversation(conversationMessage.idEmpresa, conversationMessage.idContact!, conversationMessage.idUser!)

    const contact = await this.#contactService.findById(
      conversationMessage.idEmpresa,
      conversation.idContact
    )

    conversationMessage.idConversation = conversation.id!

    let isMessageSend = null
    let chatId = null

    try {
      chatId = (await this.#clientsWpp.numberExists(conversationMessage.idEmpresa, contact.phone)).substring(2)
    } catch (error) {
      chatId = contact.phone.replace(/^(\d{2})9(\d{8})$/, '$1$2')
    }

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

    return conversationMessageData.id!
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
  }

  public async findAll(idEmpresa: string, idUser: string, filter?: Record<string, any>): Promise<ConversationEntity[]> {
    const conversations = await this.#conversationRepository.findAllConversationByUser(idEmpresa, idUser, filter)

    return conversations
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

      await this.#conversationRepository.update(conversation, conversation.id!, idEmpresa)

      // cria uma nova conversa com aquele usuario
      const idConversation = await this.save({
        idContact: conversation.idContact,
        idEmpresa,
        isRead: false,
      })

      await this.addUser([
        new ConversationUserEntity({
          idUser: idUserTransfer,
          idConversation,
          idEmpresa
        })
      ])

      return
    }

    const oldUsers = await this.#conversationUsersRepository.findByConversation(conversation.id, idEmpresa)

    const conversationsUsers = oldUsers.map(e => {
      return new ConversationUserEntity({
        idUser: e.idUser,
        idConversation: conversation.id!,
        idEmpresa
      })
    })

    conversationsUsers.push(new ConversationUserEntity({
      idUser: idUserTransfer,
      idConversation: conversation.id!,
      idEmpresa
    }))


    await this.addUser(conversationsUsers)
  }

  public async listMessages(idEmpresa: string, idUser: string, idContact: string, page: number) {
    const user = await this.#userService.findById(idUser, idEmpresa)

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

  public async findConversationByContactNotFinished(idEmpresa: string, idContact: string) {
    return this.#conversationRepository
      .findConversationByContactNotFinished(idEmpresa, idContact)
  }

  private async findOrCreateConversation(idEmpresa: string, idContact: string, idUser: string) {
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
    }

    return conversation
  }

  private async formatChatId(nameConnection: string, chatId: string) {
    const _chatId = await this.#clientsWpp.numberExists(nameConnection, chatId)

    return _chatId.substring(2)
  }
}