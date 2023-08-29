import { randomUUID } from 'crypto'
import { DateTime } from 'luxon'

export class Entity {
  id?: string
  idEmpresa: string
  createdAt?: string
  updatedAt?: string

  constructor(body: any, id?: string) {
    if (!id) {
      this.id = randomUUID()
      this.createdAt = DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss')
      this.updatedAt = DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss')
    } else {
      this.id = body.id
      this.updatedAt = DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss')
    }
  }
}