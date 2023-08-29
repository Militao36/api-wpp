import { SectorEntity } from "./SectorEntity";
import { UserEntity } from "./UserEntity";
import { Entity } from "./base/Entity";

export class UserSectorEntity extends Entity {
  idUser: number
  idSector: number
  sectors?: SectorEntity
  users?: UserEntity

  constructor(body: Omit<UserSectorEntity, 'id'>, id?: string) {
    super(body, id)
    this.idUser = body.idUser
    this.idSector = body.idSector
    this.sectors = body.sectors
    this.users = body.users
  }
}