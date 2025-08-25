import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { SectorEntity } from "../entity/SectorEntity";

export class SectorRepository extends RepositoryBase<Partial<SectorEntity>> {
  #database: Knex
  
  constructor({ database }) {
    super('sectors', database)
    this.#database = database
  }
}