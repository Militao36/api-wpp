import { ConversationEntity } from "../entity/ConversationEntity"
import { SectorsDefault } from "../entity/SectorEntity"
import { ContactService } from "./ContactService"
import { ConversationService } from "./ConversationService"
import { SectorService } from "./SectorService"

export class WhatsWppService {
  #conversationService: ConversationService
  #contactService: ContactService
  #sectorService: SectorService

  constructor({ conversationService, contactService, sectorService }) {
    this.#conversationService = conversationService
    this.#contactService = contactService
    this.#sectorService = sectorService
  }

  public async handle(idEmpresa: string, body: Record<string, any>): Promise<void> {
    let idContact = await this.createContact(idEmpresa, body)

    const { id } = await this.createConversation(idEmpresa, idContact)

    await this.#conversationService.updateLastMessage(
      id,
      idEmpresa,
      body.payload.body
    )

    await this.#conversationService.addMessage(
      idEmpresa,
      id,
      null,
      body.payload.body,
      body.payload.id,
      body.payload.hasMedia,
      body.payload?.media?.url
    )
  }

  private async createContact(idEmpresa: string, body: Record<string, any>): Promise<string> {
    const phoneNumber = await this.#conversationService.formatChatId(idEmpresa, body.payload.from)
    const contact = await this.#contactService.findByPhone(idEmpresa, phoneNumber)

    if (contact) {
      return contact.id
    }

    const data = body.payload._data
    const idContact = await this.#contactService.save({
      idEmpresa,
      name: data.pushName,
      phone: phoneNumber
    })

    return idContact
  }

  private async createConversation(idEmpresa: string, idContact: string): Promise<{ id: string, conversation: ConversationEntity }> {
    const conversation = await this.#conversationService.findConversationByContactNotFinished(idEmpresa, idContact)

    let idConversation = null

    if (!conversation) {
      const idSector = await this.findOrCreateSector(idEmpresa)

      idConversation = await this.#conversationService.save({
        idContact,
        idEmpresa,
        isRead: true,
        idSector,
      })
    } else {
      idConversation = conversation.id
    }

    return {
      id: idConversation!,
      conversation,
    }
  }

  private async findOrCreateSector(idEmpresa: string) {
    const sectors = await this.#sectorService.list(idEmpresa)

    const sector = sectors.find(s => s.name === SectorsDefault.geral)

    if (!sector) {
      return await this.#sectorService.save({
        idEmpresa,
        name: 'Geral'
      })
    }

    return sector.id
  }
}