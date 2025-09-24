import { Entity } from "./Base/Entity"
import { UserEntity } from "./UserEntity"


export enum SectorsDefault {
  geral = 'Geral'
}

export class SectorEntity extends Entity {
  idEmpresa: string
  name: string

  constructor(sector: Omit<SectorEntity, 'id'>, id?: string) {
    super(sector, id)
    this.idEmpresa = sector.idEmpresa
    this.name = sector.name
  }
}