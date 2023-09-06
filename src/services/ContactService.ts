import { ContactRepository, FilterUserContactRepository } from '../repositories/ContactRepository'
import { ContactEntity } from '../entities/ContactEntity'

export class ContactService {
  #contactRepository: ContactRepository
  constructor({ contactRepository }) {
    this.#contactRepository = contactRepository
  }

  public async save(contact: ContactEntity): Promise<number> {
    const id = await this.#contactRepository.save(contact)
    return id
  }

  public async list(filter: FilterUserContactRepository) {
    return this.#contactRepository.list(filter)
  }
}