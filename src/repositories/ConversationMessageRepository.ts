import { Knex } from 'knex'
import { User } from './UserRepository'
import { RepositoryBase } from './base/RepositoryBase'
import { Conversation } from './ConversationRepository'

export type ConversationMessage = {
  id: number
  idEmpresa: string
  idConversation: number
  idUser: number
  message: string
  user: User
  conversation: Conversation
}

export class ConversationMessageRepository extends RepositoryBase<Partial<ConversationMessage>> {
  #database: Knex
  constructor({ database }) {
    super('conversation_message', database)
    this.#database = database
  }

  async findMessagesByIdConversation(idEmpresa: string, idConversation: number):Promise<ConversationMessage[]> {
    const messagesConverstion = await this.#database.table(this.table)
      .select()
      .where({ idConversation, idEmpresa })

    return messagesConverstion
  }
}