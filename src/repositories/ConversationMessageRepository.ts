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
  messageId: string
  user: User
  conversation: Conversation
  hasMedia: boolean
  file: string
}

export class ConversationMessageRepository extends RepositoryBase<Partial<ConversationMessage>> {
  #database: Knex
  constructor({ database }) {
    super('conversation_message', database)
    this.#database = database
  }

  async findMessagesByIdConversation(idEmpresa: string, idConversation: number, page = 30): Promise<ConversationMessage[]> {
    const messagesConverstion = await this.#database.table(this.table)
      .select()
      .where({ idConversation, idEmpresa })
      .limit(30)
      .offset((parseInt(`${page}`) - 1) * 30)
      .orderBy('id', 'desc')

    return messagesConverstion
  }

  async findByLatestMessageIdConversation(idEmpresa: string, idConversation: number, idUser: number): Promise<ConversationMessage> {
    const messagesConverstion = await this.#database.table(this.table)
      .select()
      .where({ idConversation, idEmpresa, idUser })
      .orderBy('id', 'desc')
      .first()

    return messagesConverstion
  }
}