import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";
import { User } from "./UserRepository";
import { UserSector } from "./UserSectorRepository";


export type FilterSectorRepository = {
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

  async list(filter: FilterSectorRepository) {
    let query = this.#database.table(this.table)
      .select<Sector[]>()

    query = this.builderFilters(query, filter)
    const result = await this.builderIncludes((await query), filter)

    return result
  }

  // #region privates
  private builderFilters(query: Knex.QueryBuilder<{}, Sector[]>, { filter, limit, first }: FilterSectorRepository) {
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

  private async builderIncludes(sectors: Sector[], { includes }: FilterSectorRepository) {
    if (includes.users) {
      for await (const sector of sectors) {
        const usersSectors = await this.#database.table('user_sector')
          .select<UserSector[]>('idUser')
          .where({ idSector: sector.id })

        const users = await this.#database.table('users').select<User[]>()
          .whereIn('id', usersSectors.map(e => e.idUser))

        sector.users = users
      }
    }

    return sectors
  }
  // #region 
}