import { ContactEntity } from "../entity/ContactEntity"
import { ContactRepository } from "../repositories/ContactRepository"

export class ContactService {
  #contactRepository: ContactRepository
  constructor({ contactRepository }) {
    this.#contactRepository = contactRepository
  }

  public async save(contact: ContactEntity): Promise<string> {
    const contactData = new ContactEntity(contact)
    
    await this.#contactRepository.save(contactData)

    return contactData.id!
  }

  public async findByPhone(idEmpresa: string, phone: string) {
    return this.#contactRepository.findByPhone(idEmpresa, phone)
  }

  public async findById(idEmpresa: string, id: string) {
    return this.#contactRepository.findById(id, idEmpresa)
  }

  public async findAll(idEmpresa: string) {
    return this.#contactRepository.findAll(idEmpresa)
  }
}