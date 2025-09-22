import { ConversationEntity } from "../entity/ConversationEntity"
import { ClientsWpp } from "../wpp"
import { ContactService } from "./ContactService"
import { ConversationService } from "./ConversationService"
import { SectorService } from "./SectorService"
import { UserService } from "./UserService"

export class BotService {
  #conversationService: ConversationService
  #contactService: ContactService
  #clientsWpp: ClientsWpp
  #userService: UserService
  #sectorService: SectorService

  constructor({ conversationService, sectorService, contactService, clientsWpp, userService }) {
    this.#conversationService = conversationService
    this.#contactService = contactService
    this.#clientsWpp = clientsWpp
    this.#sectorService = sectorService
    this.#userService = userService
  }

  async handle(idEmpresa: string, body: Record<string, any>): Promise<void> {
    const phoneNumber = await this.#conversationService.formatChatId(idEmpresa, body.payload.from)

    let idContact = await this.createContact(idEmpresa, body)

    const { id } = await this.createConversation(idEmpresa, body, idContact, phoneNumber)

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

  private async createConversation(idEmpresa: string, body: Record<string, any>, idContact: string, phoneNumber: string): Promise<{ id: string, conversation: ConversationEntity }> {
    const conversation = await this.#conversationService.findConversationByContactNotFinished(idEmpresa, idContact)

    const sectors = await this.#sectorService.list(idEmpresa)
    const sectorsOptions = sectors.map((_, i) => (i + 1).toString())

    let idConversation = null

    if (!conversation) {
      let user = await this.#userService.findByUserBot(idEmpresa);

      if (!user) {
        const idUser = await this.#userService.save({
          name: `Bot - ${idEmpresa}`,
          username: idEmpresa,
          password: Math.random().toString(36).slice(-8),
          isMaster: false,
          idEmpresa
        })

        user = await this.#userService.findById(idUser, idEmpresa)
      }

      idConversation = await this.#conversationService.save({
        idContact,
        idEmpresa,
        isRead: true,
        step: 'initial',
        users: [
          {
            idEmpresa,
            id: user.id!
          }
        ]
      })

      await this.#clientsWpp.startBot(idEmpresa, body, idConversation)
    } else {
      idConversation = conversation.id

      const usersInConversation = await this.#conversationService.listUsersInConversation(idConversation!, idEmpresa)

      const hasUserBotInConversation = usersInConversation.find(u => u.username === u.idEmpresa)

      if (hasUserBotInConversation) {

        if (!sectorsOptions.includes(String(body.payload.body)) && conversation.step === 'initial') {
          await this.#clientsWpp.sendMessage(idEmpresa, {
            chatId: phoneNumber,
            message: 'Por favor escolha uma das opções (1, 2 ou 3) para prosseguir com o atendimento.'
          })
        } else {
          if (conversation.step === 'initial') {
            await this.#conversationService.update(idConversation!, idEmpresa, {
              step: 'perguntaSetor',
            })
          }
          else if (conversation.step === 'perguntaSetor') {
            await this.#conversationService.update(idConversation!, idEmpresa, {
              step: 'aguardandoAtendimento',
            })

            const sector = sectors[Number(body.payload.body) - 1]

            if (sector) {
              await this.#conversationService.update(idConversation!, idEmpresa, {
                idSector: sector.id
              })
            }
          }

          await this.#clientsWpp.startBot(idEmpresa, body, idConversation)
        }
        
      }
    }

    return {
      id: idConversation!,
      conversation,
    }
  }
}