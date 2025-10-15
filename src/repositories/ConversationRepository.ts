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
      limit?: number,
      finished?: string,
      createdAtGraterThan?: string,
      createdAtLessThan?: string
      page?: number
      idSector?: string
      status?: string
      ids?: string[]
    }
  ): Promise<ConversationEntity[]> {
    const data = this.#database.table(this.table)
      .select(['conversations.*', 'contacts.name', 'contacts.urlProfile', 'contacts.id as idContact', 'sectors.name as sectorName'])
      .where('conversations.idEmpresa', '=', idEmpresa)
      .innerJoin('contacts', 'contacts.id', '=', 'conversations.idContact')
      .leftJoin('sectors', 'sectors.id', '=', 'conversations.idSector')


    if (filter?.createdAtGraterThan) {
      data.where('createdAt', '>', filter.createdAtGraterThan)
    }

    if (filter?.createdAtLessThan) {
      data.where('createdAt', '<', filter.createdAtLessThan)
    }

    if (idUser) {
      data.innerJoin('conversation_users', 'conversations.id', '=', 'conversation_users.idConversation')
        .where('conversation_users.idUser', '=', idUser)
    }

    if (filter?.idSector) {
      data.where('conversations.idSector', '=', filter.idSector)
    }

    if (filter?.status) {
      data.where('conversations.status', '=', filter.status)
    }

    if (filter?.ids && filter.ids.length > 0) {
      data.whereIn('conversations.id', filter.ids)
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

    if (filter?.finished) {
      if (filter.finished === 'true') {
        data.whereNotNull('conversations.finishedAt')
      } else {
        data.whereNull('conversations.finishedAt')
      }
    }

    return await data.orderBy('conversations.updatedAt', 'asc')
      .limit(Number((filter?.limit || 20)))
      .offset(Number(((filter?.page || 1) - 1) * (filter?.page || 20)))
  }
}