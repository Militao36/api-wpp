import { Knex } from 'knex'

const TABLE = 'user_sector'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(TABLE, (table) => {
    table.uuid('id').primary()
    table.uuid('idEmpresa').notNullable()
    table.string('idUser').references('id').inTable('users').unsigned()
    table.string('idSector').references('id').inTable('sectors').unsigned()
    table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now())
    table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(TABLE)
}
