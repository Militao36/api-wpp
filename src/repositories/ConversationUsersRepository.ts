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

  async relationExists(idUser: number, idConversation: number, idEmpresa: string) {
    const exists = await this.#database.table<ConversationUser>(this.table)
      .select()
      .where({ idUser, idConversation, idEmpresa })
      .first()
      
    return !!exists
  }
}