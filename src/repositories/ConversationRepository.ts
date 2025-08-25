import { Knex } from 'knex'
import { RepositoryBase } from './base/RepositoryBase'
import { ConversationEntity } from '../entity/ConversationEntity'

export type FilterConversationRepository = {
  limit?: number
  first?: boolean
  idEmpresa: string
  orderByKey?: string
  orderBy?: string
  filter?: {
    idConversation?: number
    idContact?: number
    idPreviousConversation?: number
    idUser?: number
    finishedAt?: boolean
  }
  includes?: {
    users?: Boolean
    contact?: Boolean
    conversation?: Boolean
    messages?: Boolean
  }
}

export class ConversationRepository extends RepositoryBase<Partial<ConversationEntity>> {
  #database: Knex
  constructor({ database }) {
    super('conversations', database)
    this.#database = database
  }

  async findConversationByContactNotFinished(idEmpresa: string, idContact: string): Promise<ConversationEntity> {
    return this.#database.table(this.table)
      .select()
      .where({ idEmpresa, idContact, finishedAt: null })
      .first()
  }

  async findAllConversationByUser(
    idEmpresa: string,
    idUser: string,
    filter?: {
      messageId?: string,
      limit?: number,
      idGraterThan?: number,
      idLessThan?: number
    }
  ): Promise<ConversationEntity[]> {
    const data = this.#database.table(this.table)
      .select(['conversations.*', 'contacts.name'])
      .where('conversations.idEmpresa', '=', idEmpresa)
      .innerJoin('conversation_users', 'conversations.id', '=', 'conversation_users.idConversation')
      .innerJoin('contacts', 'contacts.id', '=', 'conversations.idContact')
      .where('conversation_users.idUser', '=', idUser)
      .limit(filter.limit ?? 20)


    if (filter.idGraterThan) {
      data.where('id', '>', filter.idGraterThan)
    }

    if (filter.idLessThan) {
      data.where('id', '<', filter.idLessThan)
    }


    if (filter.messageId) {
      const aux = await data.where('messageId', '=', filter.messageId).first() as ConversationEntity

      const afterId = (+aux.id) - 10
      const beforeId = aux.id + 9

      const registersAfters = await this.findAllConversationByUser(idEmpresa, idUser, { limit: 10, idGraterThan: afterId })
      const registerBefores = await this.findAllConversationByUser(idEmpresa, idUser, { limit: 9, idLessThan: +beforeId })

      return [
        ...registerBefores,
        aux,
        ...registersAfters
      ]
    }

    return await data
  }
}