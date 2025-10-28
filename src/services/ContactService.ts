import container from "../container"
import { ContactEntity } from "../entity/ContactEntity"
import { SyncContacts } from "../queue"
import { ContactRepository } from "../repositories/ContactRepository"
import { ClientsWpp } from "../wpp"
import { ConversationService } from "./ConversationService"

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

    const chatId = await this.#clientsWpp.numberExists(contactData.idEmpresa, contactData.phone)

    if (!chatId) {
      console.log('contact', contact)
      throw new Error('Número de telefone inválido, não tem wpp cadastrado')
    }

    const phone = chatId.replace('@c.us', '').substring(2)

    await this.#contactRepository.save({
      ...contactData,
      phone,
    })

    await this.#syncContacts.add({
      contacts: [{
        ...contactData,
        phone: chatId,
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


    if (contactExists.phone !== contactData.phone) {
      const chatId = await container.resolve<ConversationService>('conversationService').formatChatId(idEmpresa, contactData.phone)

      if (!chatId) {
        throw new Error('Número de telefone inválido, não tem wpp cadastrado')
      }

      contactData.phone = chatId
    }

    await this.#contactRepository.update(contactData, id, idEmpresa)
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