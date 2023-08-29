import { ContactRepository, FilterUserContactRepository } from '../repositories/ContactRepository'
import { UserEntity } from '../entities/UserEntity'
import { ContactEntity } from '../entities/ContactEntity'

export class ContactService {
  #contactRepository: ContactRepository
  constructor({ contactRepository }) {
    this.#contactRepository = contactRepository
  }

  public async save(contact: ContactEntity): Promise<string> {
    await this.#contactRepository.save(contact)
    return contact.id
  }

  public async list(filter: FilterUserContactRepository) {
    return this.#contactRepository.list(filter)
  }
}