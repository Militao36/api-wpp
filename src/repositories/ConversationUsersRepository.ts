import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { ConversationUserEntity } from "../entity/ConversationUserEntity";
import { UserEntity } from "../entity/UserEntity";

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

  async findByConversation(idConversation: string, idEmpresa: string, includes: { users?: boolean } = {}) {
    const query = this.#database.table(this.table)
      .select<(ConversationUserEntity & UserEntity)[]>()
      .where({ idConversation, 'conversation_users.idEmpresa': idEmpresa })
      .orderBy('conversation_users.createdAt', 'desc')

    if (includes.users) {
      query
        .innerJoin('users', 'users.id', 'conversation_users.idUser')
    }

    return await query
  }


  async findByUser(idUser: string, idEmpresa: string) {
    const conversations = await this.#database.table(this.table)
      .select<ConversationUserEntity[]>()
      .where({ idUser, idEmpresa })
      .orderBy('createdAt', 'desc')

    return conversations
  }

  async deleteAllRelations(idConversation: string, idEmpresa: string) {
    await this.#database.table<ConversationUserEntity>(this.table)
      .delete()
      .where({ idConversation, idEmpresa })
  }

  async removeUser(idConversation: string, idUser: string, idEmpresa: string) {
    await this.#database.table<ConversationUserEntity>(this.table)
      .delete()
      .where({ idConversation, idUser, idEmpresa })
  }
}