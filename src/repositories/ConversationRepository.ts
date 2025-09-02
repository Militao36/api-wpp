import { Knex } from 'knex'
import { RepositoryBase } from './base/RepositoryBase'
import { ConversationEntity } from '../entity/ConversationEntity'
import { DateTime } from 'luxon'

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

export class ConversationRepository extends RepositoryBase<ConversationEntity> {
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
      // messageId?: string,
      limit?: number,
      finished?: string,
      createdAtGraterThan?: string,
      createdAtLessThan?: string
      page?: number
    }
  ): Promise<ConversationEntity[]> {
    const data = this.#database.table(this.table)
      .select(['conversations.*', 'contacts.name', 'contacts.urlProfile', 'contacts.id as idContact'])
      .where('conversations.idEmpresa', '=', idEmpresa)
      .innerJoin('conversation_users', 'conversations.id', '=', 'conversation_users.idConversation')
      .innerJoin('contacts', 'contacts.id', '=', 'conversations.idContact')
      .where('conversation_users.idUser', '=', idUser)
      .limit((filter.limit || 20))
      .offset(((filter?.page || 1) - 1) * (filter.page || 20))

    if (filter.createdAtGraterThan) {
      data.where('createdAt', '>', filter.createdAtGraterThan)
    }

    if (filter.createdAtLessThan) {
      data.where('createdAt', '<', filter.createdAtLessThan)
    }

    // if (filter.messageId) {
    //   const conversation = await data.where('messageId', '=', filter.messageId).first() as ConversationEntity

    //   const conversationDate = DateTime.fromJSDate(conversation.createdAt as any).toSQLDate()

    //   const registersAfters = await this.findAllConversationByUser(idEmpresa, idUser, {
    //     limit: 10,
    //     createdAtGraterThan: conversationDate
    //   })

    //   const registerBefores = await this.findAllConversationByUser(idEmpresa, idUser, {
    //     limit: 9,
    //     createdAtLessThan: conversationDate
    //   })

    //   return [
    //     ...registerBefores,
    //     conversation,
    //     ...registersAfters
    //   ]
    // }

    if (filter.finished) {
      if (filter.finished === 'true') {
        data.whereNotNull('conversations.finishedAt')
      } else {
        data.whereNull('conversations.finishedAt')
      }
    }

    return await data
  }
}