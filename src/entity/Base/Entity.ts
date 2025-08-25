import { randomUUID } from 'crypto'
import { DateTime } from 'luxon'

export class Entity {
  id?: string
  createdAt?: string
  updatedAt?: string

  constructor (body: any, id?: string) {
    if (id === null || id === undefined || id === '') {
      this.id = randomUUID()
      this.createdAt = DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss')
      this.updatedAt = DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss')
    } else {
      this.id = id
      this.updatedAt = DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss')
    }
  }
}
