import { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  return knex.raw(`
    CREATE TRIGGER conversation_update
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    BEGIN
      SET NEW.updatedAt = NOW();
    END;
  `)
}

export async function down (knex: Knex): Promise<void> {
  return knex.raw(`DROP TRIGGER IF EXISTS conversation_update;`)
}
