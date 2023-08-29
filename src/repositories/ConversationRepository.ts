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
    idUser: number
    idConversation: number
    idContact: number
    idPreviousConversation: number
  }
  includes: {
    user: UserEntity
    contact: ContactEntity
    conversation: ConversationEntity
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

    query = this.builderFilters(query, filter)
    const result = await this.builderIncludes((await query), filter)

    return result
  }

  // #region privates
  private builderFilters(query: Knex.QueryBuilder<{}, ConversationEntity[]>, { filter, limit, first }: FilterConversationRepository) {
    for (const key in filter) {

      if (key === 'idPreviousConversation') {
        query.where('id', '=', filter[key])
      }

      if (filter[key]) {
        query.where(key, 'like', `%${filter[key]}%`)
      }
    }

    if (filter?.idEmpresa) {
      query.where({ idEmpresa: filter.idEmpresa })
    }

    if (limit) {
      query.limit(limit)
    }

    if (first) {
      query.first()
    }

    return query
  }

  private async builderIncludes(conversations: ConversationEntity[], { includes }: FilterConversationRepository) {
    if (includes.user || includes.contact || includes.conversation) {
      for await (const conversation of conversations) {

        if (includes.user) {
          const user = await this.#database.table('users').select<UserEntity>()
            .where('id', '=', conversation.idUser)
            .first()

          conversation.user = user
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