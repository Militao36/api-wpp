import { Knex } from 'knex'

const TABLE = 'conversation_message'

export async function up (knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.string('messageId').unique()
  })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.dropColumn('messageId')
  })
}
