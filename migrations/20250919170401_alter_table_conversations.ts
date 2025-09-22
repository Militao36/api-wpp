import { Knex } from 'knex'

const TABLE = 'conversations'

export async function up (knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.string('step').nullable()
    table.string('idSector').references('id').inTable('sectors')
  })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.dropColumn('step')
    table.dropColumn('idSector')
  })
}
