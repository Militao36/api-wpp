import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { User } from "./UserRepository";
import { UserSector } from "./UserSectorRepository";


export type Sector = {
  id: number
  idEmpresa: string
  name: string
  users: User[]
}

export class SectorRepository extends RepositoryBase<Partial<Sector>> {
  #database: Knex
  constructor({ database }) {
    super('sectors', database)
    this.#database = database
  }
}