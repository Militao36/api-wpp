import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { ConversationUserEntity } from "../entity/ConversationUserEntity";

export class ConversationUsersRepository extends RepositoryBase<Partial<ConversationUserEntity>> {
  #database: Knex
  constructor({ database }) {
    super('conversation_users', database)
    this.#database = database
  }

  async relationExists(idUser: string, idConversation: string, idEmpresa: string) {
    const exists = await this.#database.table<ConversationUserEntity>(this.table)
      .select()
      .where({
        idUser,
        idConversation,
        idEmpresa
      })
      .first()

    return !!exists
  }

  async deleteAllRelations(idConversation: string, idEmpresa: string) {
    await this.#database.table<ConversationUserEntity>(this.table)
      .delete()
      .where({ idConversation, idEmpresa })
  }
}