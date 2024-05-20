import { Knex } from 'knex'

const TABLE = 'contacts'

export async function up (knex: Knex): Promise<void> {
  return knex.schema.createTable(TABLE, (table) => {
    table.increments('id')
    table.uuid('idEmpresa').notNullable()
    table.string('name', 100).defaultTo(null)
    table.string('phone', 20).notNullable()
    table.string('email', 50)
    table.string('gender', 25)
    table.string('address', 100)
    table.string('complement', 25)
    table.string('city', 50)
    table.string('state', 2)
    table.string('postalCode', 2)
    table.string('nation', 50)
    table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now())
    table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now())
  })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.dropTable(TABLE)
}
