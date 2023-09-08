import { Knex } from "knex";
import { User } from "./UserRepository";
import { RepositoryBase } from "./base/RepositoryBase";
import { Conversation } from "./ConversationRepository";

export type FilterConversationMessageRepository = {
  limit?: number
  first: boolean
  filter: {
    idEmpresa: string
    idConversation: number
    idUser: number
  }
  includes: {
    user: Boolean
    conversation: Boolean
  }
}

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

  async list(filter: FilterConversationMessageRepository) {
    let query = this.#database.table(this.table)
      .select<ConversationMessage[]>()

    await this.builderFilters(query, filter)
    const result = await this.builderIncludes((await query), filter)

    return result
  }

  // #region privates
  private async builderFilters(query: Knex.QueryBuilder<{}, ConversationMessage[]>, { filter = {} as any, limit, first }: FilterConversationMessageRepository) {
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

  private async builderIncludes(conversationMessages: ConversationMessage[], { includes = {} as any }: FilterConversationMessageRepository) {
    if (includes.user || includes.conversation) {
      for await (const conversationMessage of conversationMessages) {
        if (includes.user) {
          const conversation = await this.#database.table('conversation').select<Conversation>().where('id', '=', conversationMessage.id)

          conversationMessage.conversation = conversation
        }

        if (includes.user) {
          const user = await this.#database.table('user').select<User>()
            .where('id', '=', conversationMessage.idUser)
            .first()

            conversationMessage.user = user
        }
      }
    }

    return conversationMessages
  }
  // #region 
}