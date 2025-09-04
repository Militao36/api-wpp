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

  async findAllPaginationWithConversationIdUser(idEmpresa: string, idContact: string, idUser: string, page = 30): Promise<ConversationMessageEntity[]> {
    const query = this.#database.table(this.table)
      .select<ConversationMessageEntity[]>(
        "conversation_message.*",
        "users.name",
        "users.isMaster"
      )
      .innerJoin('conversations', 'conversations.id', 'conversation_message.idConversation')
      .leftJoin('users', 'users.id', `${this.table}.idUser`)
      .where('conversations.idContact', '=', idContact)

    if (idUser) {
      query
        .innerJoin('conversation_users', 'conversation_users.idConversation', 'conversation_message.idConversation')
        .andWhere('conversation_users.idUser', '=', idUser)
    }

    return await query
      .andWhere('conversation_message.idEmpresa', '=', idEmpresa)
      .distinct('conversation_message.id')
      .orderBy('conversation_message.createdAt', 'desc')
      .limit(30)
      .offset((parseInt(`${page}`) - 1) * 30)
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