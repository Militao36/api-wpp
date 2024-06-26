import { Knex } from 'knex'

const TABLE = 'conversation_message'

export async function up (knex: Knex): Promise<void> {
  return knex.schema.createTable(TABLE, (table) => {
    table.increments('id')
    table.uuid('idEmpresa').notNullable()
    table.integer('idUser').references('id').inTable('users').unsigned().defaultTo(null)
    table.integer('idConversation').references('id').inTable('conversations').unsigned().defaultTo(null)
    table.string('message').notNullable()
    table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now())
    table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now())
  })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.dropTable(TABLE)
}
