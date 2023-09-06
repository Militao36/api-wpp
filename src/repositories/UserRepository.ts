import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { Sector } from "./SectorRepository";
import { UserSector } from "./UserSectorRepository";

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

  async list(filter: FilterUserRepository) {
    let query = this.#database.table(this.table)
      .select<User[]>()

    query = this.builderFilters(query, filter)
    const result = await this.builderIncludes((await query), filter)

    return result
  }

  // #region privates
  private builderFilters(query: Knex.QueryBuilder<{}, User[]>, { filter, limit, first }: FilterUserRepository) {
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

  private async builderIncludes(users: User[], { includes }: FilterUserRepository) {
    if (Boolean(includes?.sectors)) {
      for await (const sector of users) {
        const usersSectors = await this.#database.table('user_sector')
          .select<UserSector[]>('idSector')
          .where({ idSector: sector.id })

        const sectors = await this.#database.table('sectors').select<Sector[]>()
          .whereIn('id', usersSectors.map(e => e.idSector))

        sector.sectors = sectors
      }
    }

    return users
  }
  // #region 
}