import { Knex } from "knex";

import { ConversationEntity } from "../entities/ConversationEntity";
import { ContactEntity } from "../entities/ContactEntity";
import { RepositoryBase } from "./base/RepositoryBase";
import { UserEntity } from "../entities/UserEntity";

export type FilterConversationRepository = {
  limit?: number
  first: boolean
  filter: {
    idEmpresa: string
    idConversation: number
    idContact: number
    idPreviousConversation: number
    idUser: number
  }
  includes: {
    users: Boolean
    contact: Boolean
    conversation: Boolean
  }
}

export class ConversationRepository extends RepositoryBase<ConversationEntity> {
  #database: Knex
  constructor({ database }) {
    super('conversations', database)
    this.#database = database
  }

  async list(filter: FilterConversationRepository) {
    let query = this.#database.table(this.table)
      .select<ConversationEntity[]>()

    await this.builderFilters(query, filter)
    const result = await this.builderIncludes((await query), filter)

    return result
  }

  // #region privates
  private async builderFilters(
    query: Knex.QueryBuilder<{},
      ConversationEntity[]>, { filter, limit, first }: FilterConversationRepository
  ) {
    Object.keys(filter).map(async (key) => {
      if (key === 'idPreviousConversation') {
        query.where('id', '=', filter[key])
      } else if (key === 'idUser') {
        const usersConversation = await this.#database
          .table('conversation_users').select<any[]>()
          .where('idUser', '=', filter[key])
        query.whereIn('id', usersConversation.map(e => e.idConversation))
      } else {
        if (filter[key]) {
          query.where(key, 'like', `%${filter[key]}%`)
        }
      }
    })


    if (filter?.idEmpresa) {
      query.where({ idEmpresa: filter.idEmpresa })
    }

    if (limit) {
      query.limit(limit)
    }

    if (first) {
      query.first()
    }

  }

  private async builderIncludes(conversations: ConversationEntity[], { includes }: FilterConversationRepository) {
    if (includes.users || includes.contact || includes.conversation) {
      for await (const conversation of conversations) {

        if (includes.users) {
          const usersConversation = await this.#database.table('conversation_users').select<any[]>()
            .where('idConversation', '=', conversation.id)

          const users = await this.#database.table('users').select<UserEntity[]>()
            .whereIn('id', usersConversation.map(e => e.idUser))

          conversation.users = users
        }

        if (includes.contact) {
          const contact = await this.#database.table('contacts').select<ContactEntity>()
            .where('id', '=', conversation.idContact)
            .first()

          conversation.contact = contact
        }

        if (includes.conversation) {
          const dataConversation = await this.#database.table('conversations').select<ConversationEntity>()
            .where('id', '=', conversation.idPreviousConversation)
            .first()

          conversation.conversation = dataConversation
        }
      }
    }

    return conversations
  }
  // #region 
}