import { Knex } from "knex";

import { RepositoryBase } from "./base/RepositoryBase";

export type FilterUserContactRepository = {
  limit?: number
  first: boolean
  filter: {
    idEmpresa: string
    name: string
    phone: string
  }
}

export type Contact = {
  id: number
  idEmpresa: string
  name: string
  phone: string
}

export class ContactRepository extends RepositoryBase<Partial<Contact>> {
  #database: Knex
  constructor({ database }) {
    super('contacts', database)
    this.#database = database
  }

  async list(filter: FilterUserContactRepository) {
    let query = this.#database.table(this.table)
      .select<Contact[]>()

    query = this.builderFilters(query, filter)

    return await query
  }

  // #region privates
  private builderFilters(query: Knex.QueryBuilder<{}, Contact[]>, { filter, limit, first }: FilterUserContactRepository) {
    for (const key in filter) {
      if (filter[key]) {
        query.where(key, 'like', `%${filter[key]}%`)
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

  // private async builderIncludes(sectors: Contact[], { includes }: FilterUserContactRepository) {
  //   if (includes.users) {
  //     for await (const sector of sectors) {
  //       const usersSectors = await this.#database.table('user_sector')
  //         .select<UserContactEntity[]>('idUser')
  //         .where({ idSector: sector.id })

  //       const users = await this.#database.table('users').select<UserEntity[]>()
  //         .whereIn('id', usersSectors.map(e => e.idUser))

  //       sector.users = users
  //     }
  //   }

  //   return sectors
  // }
  // #region 
}