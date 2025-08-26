import { Knex } from 'knex'

import { RepositoryBase } from './base/RepositoryBase'
import { ContactEntity } from '../entity/ContactEntity'

export class ContactRepository extends RepositoryBase<Partial<ContactEntity>> {
  #database: Knex
  constructor({ database }) {
    super('contacts', database)
    this.#database = database
  }

  async findByPhone(idEmpresa: string, phone: string): Promise<ContactEntity | null> {
    return this.#database.table(this.table)
      .select()
      .where({ phone, idEmpresa })
      .first()
  }

  async findAll(idEmpresa: string): Promise<ContactEntity[]> {
    const data = this.#database.table(this.table)
      .select('*')
      .where('idEmpresa', '=', idEmpresa)

    return await data
  }
}