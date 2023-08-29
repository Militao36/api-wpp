import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { UserEntity } from "../entities/UserEntity";
import { UserSectorEntity } from "../entities/UserSector";
import { SectorEntity } from "../entities/SectorEntity";

export type FilterUserRepository = {
  limit?: number
  first: boolean
  filter: {
    idEmpresa: string
    username: string
    isMaster: boolean
  }
  includes: {
    sectors: boolean
  }
}

export class UserRepository extends RepositoryBase<UserEntity> {
  #database: Knex
  constructor({ database }) {
    super('users', database)
    this.#database = database
  }

  async list(filter: FilterUserRepository) {
    let query = this.#database.table(this.table)
      .select<UserEntity[]>()

    query = this.builderFilters(query, filter)
    const result = await this.builderIncludes((await query), filter)

    return result
  }

  // #region privates
  private builderFilters(query: Knex.QueryBuilder<{}, UserEntity[]>, { filter, limit, first }: FilterUserRepository) {
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

  private async builderIncludes(users: UserEntity[], { includes }: FilterUserRepository) {
    if (includes.sectors) {
      for await (const sector of users) {
        const usersSectors = await this.#database.table('user_sector')
          .select<UserSectorEntity[]>('idUser')
          .where({ idSector: sector.id })

        const sectors = await this.#database.table('sectors').select<SectorEntity[]>()
          .whereIn('id', usersSectors.map(e => e.idSector))

        sector.sectors = sectors
      }
    }

    return users
  }
  // #region 
}