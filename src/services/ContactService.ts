import { Contact, ContactRepository } from '../repositories/ContactRepository'

export class ContactService {
  #contactRepository: ContactRepository
  constructor({ contactRepository }) {
    this.#contactRepository = contactRepository
  }

  public async save(contact: Contact): Promise<number> {
    const id = await this.#contactRepository.save(contact)
    return id
  }

  public async findByPhone(idEmpresa: string, phone: string) {
    return this.#contactRepository.findByPhone(idEmpresa, phone)
  }

  public async findById(idEmpresa: string, id: number) {
    return this.#contactRepository.findById(id, idEmpresa)
  }

  public async findAll(idEmpresa: string) {
    return this.#contactRepository.findAll(idEmpresa)
  }
}