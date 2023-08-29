import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { SectorEntity } from "../entities/SectorEntity";
import { UserSectorEntity } from "../entities/UserSector";
import { UserEntity } from "../entities/UserEntity";

export type FilterUserSectorRepository = {
  limit?: number
  filter: {
    idEmpresa: string
    name: string
  }
}

export class SectorRepository extends RepositoryBase<SectorEntity> {
  #database: Knex
  constructor({ database }) {
    super('sectors', database)
    this.#database = database
  }

  async list({ filter, limit }: FilterUserSectorRepository) {
    const sectors = this.#database.table(this.table)
      .select<SectorEntity[]>()

    if (filter?.idEmpresa) {
      sectors.where({ idEmpresa: filter.idEmpresa })
    }

    if (limit) {
      sectors.limit(limit)
    }

    for await (const sector of (await sectors)) {
      const usersSectors = await this.#database.table('user_sector')
        .select<UserSectorEntity[]>('idUser')
        .where({ idSector: sector.id })

      const users = await this.#database.table('users').select<UserEntity[]>()
        .whereIn('id', usersSectors.map(e => e.idUser))

      sector.users = users
    }
  }
}