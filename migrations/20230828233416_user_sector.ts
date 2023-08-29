import { Knex } from "knex";

const TABLE = 'user_sector'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(TABLE, (table) => {
    table.increments('id')
    table.integer('idUser').references('id').inTable('users')
    table.integer('idSector').references('id').inTable('sectors')
    table.dateTime('createdAt').notNullable()
    table.dateTime('updatedAt').notNullable()
  })
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(TABLE)
}

