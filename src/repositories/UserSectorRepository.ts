
import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { Sector } from "./SectorRepository";
import { User } from "./UserRepository";

export type UserSector = {
  id: number
  idEmpresa: string
  idUser: number
  idSector: number

  sectors?: Sector
  users?: User
}


export class UserSectorRepository extends RepositoryBase<Partial<UserSector>> {
  #database: Knex
  constructor({ database }) {
    super('user_sector', database)
    this.#database = database
  }
}