import type { Knex } from 'knex'
import 'dotenv/config'

const config = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    decimalNumbers: true,
    timezone: '+00:00',
    pool: {
      min: 2,
      max: 10
    }
  }
}

module.exports = config
