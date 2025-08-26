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
  urlProfile?: string
  isManual?: boolean

  constructor(data: Omit<ContactEntity, 'id'>, id?: string) {
    super(data, id)
    this.idEmpresa = data.idEmpresa
    this.name = data.name
    this.phone = data.phone
    this.email = data.email
    this.gender = data.gender
    this.address = data.address
    this.complement = data.complement
    this.city = data.city
    this.state = data.state
    this.postalCode = data.postalCode
    this.nation = data.nation
    this.urlProfile = data.urlProfile
    this.isManual = data.isManual ?? false
  }
}