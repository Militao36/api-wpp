import { SectorEntity } from "./SectorEntity";
import { Entity } from "./base/Entity";

export class UserEntity extends Entity {
  name: string
  username: string
  password: string
  isMaster: boolean

  // aux
  sectors?: SectorEntity[]

  constructor(body: Omit<UserEntity, 'id'>, id?: string) {
    super(body, id)
    this.name = body.name
    this.password = body.password
    this.isMaster = body?.isMaster ?? null

    this.sectors = body?.sectors ?? []
  }
}