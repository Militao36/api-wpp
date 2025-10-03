import { Knex } from 'knex'
import { StatusConversation } from '../src/entity/ConversationEntity'

const TABLE = 'conversations'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.string('step').nullable()
    table.string('idSector').references('id').inTable('sectors')
    table.enum('status', [StatusConversation.CLOSED, StatusConversation.OPEN, StatusConversation.PENDING]).defaultTo('pending')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable(TABLE, (table) => {
    table.dropColumn('step')
    table.dropColumn('idSector')
    table.dropColumn('status')
  })
}
