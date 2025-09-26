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
      .select<ContactEntity[]>()
      .where({ phone, idEmpresa })
      .first()
  }

  async findAllContacts(idEmpresa: string, qs: Record<string, any>): Promise<ContactEntity[]> {
    const data = this.#database.table(this.table)
      .select('*')
      .where('idEmpresa', '=', idEmpresa)
      .limit((qs?.limit || 20))
      .offset(((qs?.page || 1) - 1) * (qs?.page || 20))

    return await data
  }
}