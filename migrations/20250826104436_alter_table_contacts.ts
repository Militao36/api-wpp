import { Knex } from 'knex'

const TABLE = 'contacts'

export async function up (knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.string('urlProfile').nullable()
    table.boolean('isManual').defaultTo(false)
  })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.dropColumn('urlProfile')
    table.dropColumn('isManual')
  })
}
