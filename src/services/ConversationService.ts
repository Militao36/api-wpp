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

export class ConversationService {
  #conversationRepository: ConversationRepository
  #conversationUsersRepository: ConversationUsersRepository
  #conversationMessageRepository: ConversationMessageRepository
  #contactService: ContactService
  #clientsWpp: ClientsWpp

  constructor({ contactService, clientsWpp, conversationRepository, conversationUsersRepository, conversationMessageRepository }) {
    this.#conversationRepository = conversationRepository
    this.#conversationUsersRepository = conversationUsersRepository
    this.#conversationMessageRepository = conversationMessageRepository
    this.#contactService = contactService
    this.#clientsWpp = clientsWpp
  }

  public async save(conversation: ConversationEntity): Promise<string> {
    const conversationData = new ConversationEntity(conversation)

    await this.#conversationRepository.save({
      idContact: conversationData.idContact,
      idEmpresa: conversationData.idEmpresa
    })

    for await (const item of (conversation?.users ?? [])) {
      await this.#conversationUsersRepository.save({
        idUser: item.id,
        idConversation: conversationData.id!,
        idEmpresa: conversation.idEmpresa
      })
    }

    return conversationData.id!
  }

  public async addUser(conversationUser: ConversationUserEntity[]) {
    for (const item of conversationUser) {
      await this.#conversationUsersRepository
        .deleteAllRelations(item.idConversation, item.idEmpresa)
    }

    for await (const item of conversationUser) {
      await this.#conversationUsersRepository.save({
        idUser: item.idUser,
        idConversation: item.idConversation,
        idEmpresa: item.idEmpresa
      })
    }
  }

  public async message(conversationMessage: Partial<ConversationMessageEntity & { fileName: string, mimetype: string }>) {
    const conversation = await this.#conversationRepository
      .findById(conversationMessage.idConversation, conversationMessage.idEmpresa)

    const contact = await this.#contactService.findById(
      conversationMessage.idEmpresa,
      conversation.idContact
    )

    let isMessageSend = null

    if (!conversationMessage.hasMedia) {
      isMessageSend = await this.#clientsWpp.sendMessage(contact.idEmpresa, {
        chatId: contact.phone,
        message: conversationMessage.message
      })
    }

    if (conversationMessage.hasMedia) {
      if (
        !conversationMessage?.mimetype ||
        !conversationMessage?.file
      ) {
        throw new BadRequestExeption('Campos obrigatórios não informado (base64, file).')
      }

      isMessageSend = await this.#clientsWpp.sendMessageImage(contact.idEmpresa, {
        chatId: contact.phone,
        caption: conversationMessage.message,
        base64: conversationMessage.file,
        mimetype: conversationMessage.mimetype,
        fileName: conversationMessage.fileName
      })
    }

    if (!isMessageSend) {
      throw new BadRequestExeption('Erro ao enviar mensagem')
    }

    const conversationMessageData = new ConversationMessageEntity(conversationMessage)

    await this.#conversationMessageRepository.save({
      idEmpresa: conversationMessageData.idEmpresa,
      idConversation: conversationMessageData.idConversation,
      idUser: conversationMessageData.idUser,
      message: conversationMessageData.message,
      messageId: isMessageSend?.id ?? MessageID()
    })

    await this.updateLastMessage(
      conversationMessage.idConversation,
      conversationMessage.idEmpresa,
      conversationMessage.message
    )

    return conversationMessageData.id!
  }

  public async addMessage(idEmpresa: string, idConversation: string, idUser: string, message: string, messageId: string, hasMedia: boolean, url: string) {
    await this.#conversationMessageRepository.save({
      idEmpresa: idEmpresa,
      idConversation: idConversation,
      idUser: idUser,
      message: hasMedia ? null : message,
      messageId,
      hasMedia: hasMedia,
      file: hasMedia ? url : '',
    })

    await this.updateLastMessage(
      idConversation,
      idEmpresa,
      message
    )
  }

  public async findAll(idEmpresa: string, idUser: string, filter?: { messageId?: string }): Promise<ConversationEntity[]> {
    const conversations = await this.#conversationRepository.findAllConversationByUser(idEmpresa, idUser, filter)
    return conversations
  }

  public async listMessages(idEmpresa: string, idConversation: string, page: number) {
    const messages = await this.#conversationMessageRepository
      .findMessagesByIdConversation(idEmpresa, idConversation, page)

    await this.#conversationRepository
      .update({ isRead: true }, idConversation, idEmpresa)

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
}