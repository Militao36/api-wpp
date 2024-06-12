import { Knex } from 'knex'
import { Contact } from './ContactRepository'
import { User } from './UserRepository'
import { RepositoryBase } from './base/RepositoryBase'
import { ConversationMessage } from './ConversationMessageRepository'

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

export type Conversation = {
  id?: number
  idEmpresa?: string
  idContact?: number
  idPreviousConversation?: number
  finishedAt?: string
  isRead: boolean
  users?: User[]
  contact?: Contact
  conversation?: Conversation
  messages?: ConversationMessage[]
}

export class ConversationRepository extends RepositoryBase<Partial<Conversation>> {
  #database: Knex
  constructor({ database }) {
    super('conversations', database)
    this.#database = database
  }

  async findConversationByContactNotFinished(idEmpresa: string, idContact: number): Promise<Conversation> {
    return this.#database.table(this.table)
      .select()
      .where({ idEmpresa, idContact, finishedAt: null })
      .first()
  }

  async findAllConversationByUser(idEmpresa: string, idUser: number): Promise<Conversation[]> {
    const data = this.#database.table(this.table)
      .select(['conversations.*'])
      .where('idEmpresa', '=', idEmpresa)
      .innerJoin('conversation_users', 'conversations.id', '=', 'conversation_users.idUser')
      .where('conversation_users.idUser', '=', idUser)

    return await data
  }
}