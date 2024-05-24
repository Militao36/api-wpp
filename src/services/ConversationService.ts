import { Contact } from '../repositories/ContactRepository'
import { ConversationMessage, ConversationMessageRepository, FilterConversationMessageRepository } from '../repositories/ConversationMessageRepository'
import { Conversation, ConversationRepository, FilterConversationRepository } from '../repositories/ConversationRepository'
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

  constructor ({ contactService, clientsWpp, conversationRepository, conversationUsersRepository, conversationMessageRepository }) {
    this.#conversationRepository = conversationRepository
    this.#conversationUsersRepository = conversationUsersRepository
    this.#conversationMessageRepository = conversationMessageRepository
    this.#clientsWpp = clientsWpp
  }

  public async save (conversation: Conversation): Promise<number> {
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

  public async addUser (conversationUser: ConversationUser[]) {
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

  public async message (conversationMessage: Partial<ConversationMessage>) {
    const id = await this.#conversationMessageRepository.save({
      idEmpresa: conversationMessage.idEmpresa,
      idConversation: conversationMessage.idConversation,
      idUser: conversationMessage.idUser,
      message: conversationMessage.message
    })

    const conversation = await this.#conversationRepository
      .findById(conversationMessage.id, conversationMessage.idEmpresa)

    const contact = await this.#contactService.list({
      filter: {
        idEmpresa: conversation.idEmpresa,
        id: conversation.idContact
      },
      first: true,
      limit: 1
    }) as Contact

    await this.#clientsWpp.sendMessage(contact.idEmpresa, {
      chatId: contact.phone,
      message: conversationMessage.message
    })

    return id
  }

  public async list (filter: FilterConversationRepository) {
    return this.#conversationRepository.list(filter)
  }

  public async listMessages (filter: FilterConversationMessageRepository) {
    if (!filter?.filter?.idConversation || !filter?.idEmpresa) {
      throw new BadRequestExeption('Dados obrigatórios para pesquisa')
    }

    const messages = await this.#conversationMessageRepository.list(filter)

    await this.#conversationRepository.update({
      isRead: true
    }, filter.filter.idConversation, filter.idEmpresa)

    return messages
  }
}