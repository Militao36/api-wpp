import { Contact } from '../repositories/ContactRepository'
import { ConversationMessage, ConversationMessageRepository } from '../repositories/ConversationMessageRepository'
import { Conversation, ConversationRepository } from '../repositories/ConversationRepository'
import { ConversationUser, ConversationUsersRepository } from '../repositories/ConversationUsersRepository'
import { BadRequestExeption } from '../util/exceptions/BadRequest'
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

  public async save(conversation: Conversation): Promise<number> {
    const conversationId = await this.#conversationRepository.save({
      idContact: conversation.idContact,
      idEmpresa: conversation.idEmpresa
    })

    for await (const item of (conversation?.users ?? [])) {
      await this.#conversationUsersRepository.save({
        idUser: item.id,
        idConversation: conversationId,
        idEmpresa: conversation.idEmpresa
      })
    }

    return conversationId
  }

  public async addUser(conversationUser: ConversationUser[]) {
    for await (const item of conversationUser) {
      const conversationUser = await this.#conversationUsersRepository
        .relationExists(item.idUser, item.idConversation, item.idEmpresa)

      if (!conversationUser) {
        await this.#conversationUsersRepository.save({
          idUser: item.idUser,
          idConversation: item.idConversation,
          idEmpresa: item.idEmpresa
        })
      }
    }
  }

  public async message(conversationMessage: Partial<ConversationMessage>) {
    const conversation = await this.#conversationRepository
      .findById(conversationMessage.idConversation, conversationMessage.idEmpresa)

    const contact = await this.#contactService.findById(
      conversationMessage.idEmpresa,
      conversation.idContact
    )

    const isMessageSend = await this.#clientsWpp.sendMessage(contact.idEmpresa, {
      chatId: contact.phone,
      message: conversationMessage.message
    })

    if (isMessageSend !== true) {
      throw new BadRequestExeption('Erro ao enviar mensagem')
    }

    const id = await this.#conversationMessageRepository.save({
      idEmpresa: conversationMessage.idEmpresa,
      idConversation: conversationMessage.idConversation,
      idUser: conversationMessage.idUser,
      message: conversationMessage.message
    })

    await this.updateLastMessage(
      conversationMessage.idConversation,
      conversationMessage.idEmpresa,
      conversationMessage.message
    )

    return id
  }

  public async findAll(idEmpresa: string, idUser: number): Promise<Conversation[]> {
    const conversations = await this.#conversationRepository.findAllConversationByUser(idEmpresa, idUser)
    return conversations
  }

  public async listMessages(idEmpresa: string, idConversation: number) {
    const messages = await this.#conversationMessageRepository
      .findMessagesByIdConversation(idEmpresa, idConversation)

    await this.#conversationRepository
      .update({ isRead: true }, idConversation, idEmpresa)

    return messages
  }

  public async updateLastMessage(idConversation: number, idEmpresa: string, lastMessage: string) {
    await this.#conversationRepository.update({
      lastMessage
    }, idConversation, idEmpresa)
  }

  public async findConversationByContactNotFinished(idEmpresa: string, idContact: number) {
    return this.#conversationRepository
      .findConversationByContactNotFinished(idEmpresa, idContact)
  }
}