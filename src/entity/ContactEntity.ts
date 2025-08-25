import { Entity } from "./Base/Entity"

export class ContactEntity extends Entity {
  idEmpresa: string
  name: string
  phone: string
  email?: string
  gender?: string
  address?: string
  complement?: string
  city?: string
  state?: string
  postalCode?: string
  nation?: string

  constructor(data: Omit<ContactEntity, 'id'>, id?: string) {
    super(data, id)
    this.idEmpresa = data.idEmpresa
    this.name = data.idEmpresa
    this.phone = data.idEmpresa
    this.email = data.idEmpresa
    this.gender = data.idEmpresa
    this.address = data.idEmpresa
    this.complement = data.idEmpresa
    this.city = data.idEmpresa
    this.state = data.idEmpresa
    this.postalCode = data.idEmpresa
    this.nation = data.idEmpresa
  }
}