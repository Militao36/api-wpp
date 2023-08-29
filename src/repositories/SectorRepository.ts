import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { SectorEntity } from "../entities/SectorEntity";
import { UserSectorEntity } from "../entities/UserSector";
import { UserEntity } from "../entities/UserEntity";

export type FilterUserSectorRepository = {
  limit?: number
  first: boolean
  filter: {
    idEmpresa: string
    name: string
  }
  includes: {
    users: boolean
  }
}

export class SectorRepository extends RepositoryBase<SectorEntity> {
  #database: Knex
  constructor({ database }) {
    super('sectors', database)
    this.#database = database
  }

  async list(filter: FilterUserSectorRepository) {
    let query = this.#database.table(this.table)
      .select<SectorEntity[]>()

    query = this.builderFilters(query, filter)
    const result = await this.builderIncludes((await query), filter)

    return result
  }

  // #region privates
  private builderFilters(query: Knex.QueryBuilder<{}, SectorEntity[]>, { filter, limit, first }: FilterUserSectorRepository) {
    for (const key in filter) {
      if (filter[key]) {
        query.where(key, '=', filter[key])
      }
    }

    if (filter?.idEmpresa) {
      query.where({ idEmpresa: filter.idEmpresa })
    }

    if (limit) {
      query.limit(limit)
    }

    if (first) {
      query.first()
    }

    return query
  }

  private async builderIncludes(sectors: SectorEntity[], { includes }: FilterUserSectorRepository) {
    if (includes.users) {
      for await (const sector of sectors) {
        const usersSectors = await this.#database.table('user_sector')
          .select<UserSectorEntity[]>('idUser')
          .where({ idSector: sector.id })

        const users = await this.#database.table('users').select<UserEntity[]>()
          .whereIn('id', usersSectors.map(e => e.idUser))

        sector.users = users
      }
    }

    return sectors
  }
  // #region 
}