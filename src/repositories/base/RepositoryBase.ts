import { type Knex } from 'knex'

export class RepositoryBase<T> {
  protected table: string
  private readonly database: Knex
  constructor (table: string, database: Knex) {
    this.table = table
    this.database = database
  }

  async save (data: T) {
    const id = await this.database.table(this.table).insert(data)
    return id[0]
  }

  async update (data: T, id: string, idEmpresa: string) {
    await this.database.table(this.table)
      .update(data)
      .where('id', '=', id)
      .andWhere('idEmpresa', '=', idEmpresa)
  }

  async delete (id: string, idEmpresa: string) {
    await this.database.table(this.table)
      .delete()
      .where('id', '=', id)
      .andWhere('idEmpresa', '=', idEmpresa)
  }

  async findById (id: string, idEmpresa: string): Promise<T> {
    const data = this.database.table(this.table)
      .select('*')
      .where('id', '=', id)
      .andWhere('idEmpresa', '=', idEmpresa)
      .first()

    return await data
  }

  async findAll (idEmpresa: string): Promise<T[]> {
    const data = this.database.table(this.table)
      .select('*')
      .where('idEmpresa', '=', idEmpresa)

    return await data
  }

  async count (idEmpresa: string) {
    const data = await this.database.table(this.table)
      .where('idEmpresa', '=', idEmpresa)
      .count('id as quantity')

    return data[0].quantity
  }
}