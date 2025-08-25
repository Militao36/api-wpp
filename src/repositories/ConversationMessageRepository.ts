import { Knex } from 'knex'
import { RepositoryBase } from './base/RepositoryBase'
import { ConversationMessageEntity } from '../entity/ConversationMessageEntity'

export class ConversationMessageRepository extends RepositoryBase<Partial<ConversationMessageEntity>> {
  #database: Knex
  constructor({ database }) {
    super('conversation_message', database)
    this.#database = database
  }

  async findMessagesByIdConversation(idEmpresa: string, idConversation: string, page = 30): Promise<ConversationMessageEntity[]> {
    const messagesConverstion = await this.#database.table(this.table)
      .select()
      .where({ idConversation, idEmpresa })
      .limit(30)
      .offset((parseInt(`${page}`) - 1) * 30)
      .orderBy('id', 'desc')

    return messagesConverstion
  }

  async findByLatestMessageIdConversation(idEmpresa: string, idConversation: string, idUser: string): Promise<ConversationMessageEntity> {
    const messagesConverstion = await this.#database.table(this.table)
      .select()
      .where({ idConversation, idEmpresa, idUser })
      .orderBy('id', 'desc')
      .first()

    return messagesConverstion
  }
}