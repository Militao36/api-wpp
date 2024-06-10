import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { Sector } from "./SectorRepository";
import { UserSector } from "./UserSectorRepository";

export type User = {
  id: number
  idEmpresa: string
  name: string
  username: string
  password: string
  isMaster: boolean
  sectors: Sector[]
}

export class UserRepository extends RepositoryBase<User> {
  #database: Knex
  constructor({ database }) {
    super('users', database)
    this.#database = database
  }
}