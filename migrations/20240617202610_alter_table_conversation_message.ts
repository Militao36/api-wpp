import { Knex } from 'knex'

const TABLE = 'conversation_message'

export async function up (knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.boolean('hasMedia').defaultTo(false)
    table.string('file').nullable()
  })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.dropColumn('hasMedia')
    table.dropColumn('file')
  })
}
