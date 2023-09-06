import { Conversation, ConversationRepository, FilterConversationRepository } from '../repositories/ConversationRepository'
import { ConversationUser, ConversationUsersRepository } from '../repositories/ConversationUsersRepository'

export class ConversationService {
  #conversationRepository: ConversationRepository
  #conversationUsersRepository: ConversationUsersRepository
  constructor({ conversationRepository, conversationUsersRepository }) {
    this.#conversationRepository = conversationRepository
    this.#conversationUsersRepository = conversationUsersRepository
  }

  public async save(conversation: Conversation): Promise<number> {
    const conversationId = await this.#conversationRepository.save({
      idContact: conversation.idContact,
      idEmpresa: conversation.idEmpresa,
    })

    for await (const item of conversation.users) {
      await this.#conversationUsersRepository.save({
        idUser: item.id,
        idConversation: conversationId,
        idEmpresa: conversation.idEmpresa,
      })
    }

    return conversationId
  }

  public async addUser(conversationUser: ConversationUser[]) {
    for await (const item of conversationUser) {
      const conversationUser = await this.#conversationUsersRepository
        .relationExists(item.idUser, item.idConversation, item.idEmpresa)
      if (!conversationUser)
        await this.#conversationUsersRepository.save({
          idUser: item.idUser,
          idConversation: item.idConversation,
          idEmpresa: item.idEmpresa,
        })
    }
  }

  public async list(filter: FilterConversationRepository) {
    return this.#conversationRepository.list(filter)
  }
}