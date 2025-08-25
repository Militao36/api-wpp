import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { UserEntity } from "../entity/UserEntity";

export class UserRepository extends RepositoryBase<UserEntity> {
  #database: Knex

  constructor({ database }) {
    super('users', database)
    this.#database = database
  }
}