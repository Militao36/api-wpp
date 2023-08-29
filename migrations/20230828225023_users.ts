import { Knex } from "knex";

const TABLE = 'users'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(TABLE, (table) => {
    table.increments('id')
    table.string('name', 100).defaultTo(null)
    table.string('username', 100).unique().notNullable()
    table.string('password', 255).notNullable()
    table.boolean('isMaster').defaultTo(false)
    table.dateTime('createdAt').notNullable()
    table.dateTime('updatedAt').notNullable()
  })
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(TABLE)
}

