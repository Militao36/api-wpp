import { ContactEntity } from "../entity/ContactEntity"
import { SyncContacts } from "../queue"
import { ContactRepository } from "../repositories/ContactRepository"
import { ClientsWpp } from "../wpp"

export class ContactService {
  #contactRepository: ContactRepository
  #clientsWpp: ClientsWpp
  #syncContacts: typeof SyncContacts


  constructor({ contactRepository, syncContacts, clientsWpp }) {
    this.#contactRepository = contactRepository
    this.#clientsWpp = clientsWpp
    this.#syncContacts = syncContacts
  }

  public async save(contact: ContactEntity): Promise<string> {
    const contactData = new ContactEntity(contact)

    await this.#contactRepository.save(contactData)

    await this.#syncContacts.add({
      contacts: [{
        ...contactData,
        phone: (await this.#clientsWpp.numberExists(contactData.idEmpresa, contactData.phone)) || contactData.phone
      }]
    })

    return contactData.id!
  }

  async update(id: string, idEmpresa: string, contact: ContactEntity): Promise<void> {
    const contactData = new ContactEntity(contact, id)

    const contactExists = await this.#contactRepository.findById(id, idEmpresa)

    if (!contactExists) {
      throw new Error('Contato não encontrado')
    }

    if (!contactExists.isManual) {
      throw new Error('Contato não pode ser editado pelo painel, apenas pelo celular')
    }

    await this.#contactRepository.update(contactData, id, idEmpresa)

    await this.#syncContacts.add({
      contacts: [{
        ...contactData,
        phone: (await this.#clientsWpp.numberExists(contactData.idEmpresa, contactData.phone)) || contactData.phone
      }]
    })
  }

  public async findByPhone(idEmpresa: string, phone: string) {
    return this.#contactRepository.findByPhone(idEmpresa, phone)
  }

  public async findById(idEmpresa: string, id: string) {
    return this.#contactRepository.findById(id, idEmpresa)
  }

  public async findAll(idEmpresa: string, qs: Record<string, any> = {}) {
    return this.#contactRepository.findAllContacts(idEmpresa, qs)
  }

  private async getProfilePicUrl(idEmpresa: string, phone: string) {
    return this.#clientsWpp.getUrlProfileByContact(idEmpresa, phone)
  }
}