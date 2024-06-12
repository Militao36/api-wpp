import { Knex } from 'knex'

import { RepositoryBase } from './base/RepositoryBase'

export type Contact = {
  id?: number
  idEmpresa: string
  name: string
  phone: string
  email?: string
  gender?: string
  address?: string
  complement?: string
  city?: string
  state?: string
  postalCode?: string
  nation?: string
}

export class ContactRepository extends RepositoryBase<Partial<Contact>> {
  #database: Knex
  constructor({ database }) {
    super('contacts', database)
    this.#database = database
  }

  async findByPhone(idEmpresa: string, phone: string): Promise<Contact | null> {
    return this.#database.table(this.table)
      .select()
      .where({ phone, idEmpresa })
      .first()
  }

  async findAll(idEmpresa: string): Promise<Pick<Contact, "name" | "phone" | "id">[]> {
    const data = this.#database.table(this.table)
      .select(["name", "phone", "id"])
      .where('idEmpresa', '=', idEmpresa)

    return await data
  }
}