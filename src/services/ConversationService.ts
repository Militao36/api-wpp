import { ConversationRepository, FilterConversationRepository } from '../repositories/ConversationRepository'
import { ConversationEntity } from '../entities/ConversationEntity'

export class ConversationService {
  #conversationRepository: ConversationRepository
  constructor({ conversationRepository }) {
    this.#conversationRepository = conversationRepository
  }

  public async save(conversation: ConversationEntity): Promise<string> {
    await this.#conversationRepository.save(conversation)
    return conversation.id
  }

  public async list(filter: FilterConversationRepository) {
    return this.#conversationRepository.list(filter)
  }
}