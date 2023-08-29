import { UserEntity } from "./UserEntity";
import { Entity } from "./base/Entity";

export class SectorEntity extends Entity {
  name: string
  users?: UserEntity[]

  constructor(body: Omit<SectorEntity, 'id'>, id?: string) {
    super(body, id)
    this.name = body.name
    this.users = body?.users ?? []
  }
}