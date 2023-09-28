import { Knex } from "knex";
import { Contact } from "./ContactRepository";
import { User } from "./UserRepository";
import { RepositoryBase } from "./base/RepositoryBase";
import { ConversationMessage } from "./ConversationMessageRepository";

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
    messages: Boolean
  }
}

export type Conversation = {
  id: number
  idEmpresa: string
  idContact: number
  idPreviousConversation: number
  finishedAt: string
  users: User[]
  contact: Contact
  conversation: Conversation
  messages: ConversationMessage[]
}

export class ConversationRepository extends RepositoryBase<Partial<Conversation>> {
  #database: Knex
  constructor({ database }) {
    super('conversations', database)
    this.#database = database
  }

  async list(filter: FilterConversationRepository) {
    let query = this.#database.table(this.table)
      .select<Conversation[]>()

    await this.builderFilters(query, filter)
    const result = await this.builderIncludes((await query), filter)

    return result
  }

  // #region privates
  private async builderFilters(
    query: Knex.QueryBuilder<{},
      Conversation[]>, { filter = {} as any, limit, first }: FilterConversationRepository
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

  private async builderIncludes(conversations: Conversation[], { includes = {} as any }: FilterConversationRepository) {
    if (includes.users || includes.contact || includes.conversation) {
      for await (const conversation of conversations) {

        if (includes.users) {
          const usersConversation = await this.#database.table('conversation_users').select<any[]>()
            .where('idConversation', '=', conversation.id)

            const users = await this.#database.table('users').select<User[]>()
            .whereIn('id', usersConversation.map(e => e.idUser))

          conversation.users = users
        }

        if (includes.contact) {
          const contact = await this.#database.table('contacts').select<Contact>()
            .where('id', '=', conversation.idContact)
            .first()

          conversation.contact = contact
        }

        if (includes.conversation) {
          const dataConversation = await this.#database.table('conversations').select<Conversation>()
            .where('id', '=', conversation.idPreviousConversation)
            .first()

          conversation.conversation = dataConversation
        }

        if (includes.messages) {
          const dataConversation = await this.#database.table('conversation_message').select<ConversationMessage[]>()
            .where('idConversation', '=', conversation.id)

          conversation.messages = dataConversation
        }
      }
    }

    return conversations
  }
  // #region 
}