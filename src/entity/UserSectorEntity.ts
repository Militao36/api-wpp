import { Entity } from "./Base/Entity"
import { SectorEntity } from "./SectorEntity"
import { UserEntity } from "./UserEntity"

export class UserSectorEntity extends Entity {
  idEmpresa: string
  idUser: number
  idSector: number

  sectors?: SectorEntity
  users?: UserEntity

  constructor(userSector: Omit<UserSectorEntity, 'id'>, id?: string) {
    super(userSector, id)
    this.idEmpresa = userSector.idEmpresa
    this.idUser = userSector.idUser
    this.idSector = userSector.idSector
    this.sectors = userSector.sectors
    this.users = userSector.users
  }
}