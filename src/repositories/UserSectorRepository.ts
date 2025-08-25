
import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { UserSectorEntity } from "../entity/UserSectorEntity";

export class UserSectorRepository extends RepositoryBase<Partial<UserSectorEntity>> {
  #database: Knex
  constructor({ database }) {
    super('user_sector', database)
    this.#database = database
  }
}