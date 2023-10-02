import { Knex } from 'knex'

const TABLE = 'conversations'

export async function up (knex: Knex): Promise<void> {
  return knex.schema.createTable(TABLE, (table) => {
    table.increments('id')
    table.uuid('idEmpresa').notNullable()
    table.integer('idContact').references('id').inTable('contacts').unsigned().defaultTo(null)
    table.integer('idPreviousConversation')
    table.dateTime('finishedAt').nullable().defaultTo(null)
    table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now())
    table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now())
  })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.dropTable(TABLE)
}
