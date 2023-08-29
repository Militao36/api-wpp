import { Entity } from "./base/Entity";

export class ContactEntity extends Entity {
  name: string
  phone: string

  constructor(body: Omit<ContactEntity, 'id'>, id?: string) {
    super(body, id)
    this.name = body.name
    this.phone = body.phone
  }
}