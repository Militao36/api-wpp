import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { UserEntity } from "../entity/UserEntity";

export class UserRepository extends RepositoryBase<UserEntity> {
  #database: Knex

  constructor({ database }) {
    super('users', database)
    this.#database = database
  }

  async findMasterUsersByIdEmpresa(idEmpresa: string): Promise<UserEntity[]> {
    const users = await this.#database('users').where({ idEmpresa }).andWhere('isMaster', '=', true).select('*')
    return users
  }

  async findByUserName(username: string): Promise<UserEntity | undefined> {
    const user = await this.#database('users').where({ username }).first()
    return user
  }
}