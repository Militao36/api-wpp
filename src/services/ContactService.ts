import { Contact, ContactRepository, FilterUserContactRepository } from '../repositories/ContactRepository'

export class ContactService {
  #contactRepository: ContactRepository
  constructor ({ contactRepository }) {
    this.#contactRepository = contactRepository
  }

  public async save (contact: Contact): Promise<number> {
    const id = await this.#contactRepository.save(contact)
    return id
  }

  public async list (filter: FilterUserContactRepository) {
    return this.#contactRepository.list(filter)
  }
}