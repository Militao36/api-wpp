import { Knex } from 'knex'

const TABLE = 'conversations'

export async function up (knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.string('lastMessage').nullable()
  })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.dropColumn('lastMessage')
  })
}
