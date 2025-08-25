import { Entity } from "./Base/Entity"
import { UserEntity } from "./UserEntity"

export class SectorEntity extends Entity {
  idEmpresa: string
  name: string
  users: UserEntity[]

  constructor(sector: Omit<SectorEntity, 'id'>, id?: string) {
    super(sector, id)
    this.idEmpresa = sector.idEmpresa
    this.name = sector.name
    this.users = sector.users
  }
}