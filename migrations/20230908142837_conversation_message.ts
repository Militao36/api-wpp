import { Knex } from 'knex'

const TABLE = 'conversation_message'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(TABLE, (table) => {
    table.uuid('id').primary()
    table.uuid('idEmpresa').notNullable()
    table.string('idUser').references('id').inTable('users').defaultTo(null)
    table.string('idConversation').references('id').inTable('conversations').defaultTo(null)
    table.string('message').nullable()
    table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now())
    table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(TABLE)
}
