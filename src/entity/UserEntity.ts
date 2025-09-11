import { Entity } from "./Base/Entity"
import { SectorEntity } from "./SectorEntity"

export class UserEntity extends Entity {
  idEmpresa: string
  name: string
  username: string
  password: string
  isMaster: boolean

  // auxiliares
  sectors?: SectorEntity[]

  constructor(user: Omit<UserEntity, 'id'>, id?: string) {
    super(user, id)
    this.idEmpresa = user.idEmpresa
    this.name = user.name
    this.username = user.username
    this.password = user.password
    this.isMaster = user.isMaster
  }
} 