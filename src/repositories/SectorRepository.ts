import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { SectorEntity } from "../entity/SectorEntity";

export class SectorRepository extends RepositoryBase<SectorEntity> {
  #database: Knex
  
  constructor({ database }) {
    super('sectors', database)
    this.#database = database
  }
}