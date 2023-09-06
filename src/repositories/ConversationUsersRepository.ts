import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";


export type ConversationUser = {
  id: number
  idEmpresa: string
  idUser: number
  idConversation: number
}

export class ConversationUsersRepository extends RepositoryBase<Partial<ConversationUser>> {
  #database: Knex
  constructor({ database }) {
    super('conversation_users', database)
    this.#database = database
  }
}