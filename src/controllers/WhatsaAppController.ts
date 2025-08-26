import { GET, POST, route } from 'awilix-express'
import { Request, Response } from 'express'
import _ from 'lodash'

import { ClientsWpp } from '../wpp'
import { ConversationService } from '../services/ConversationService'
import { ContactService } from '../services/ContactService'
import { ContactEntity } from '../entity/ContactEntity'
import { SyncContacts } from '../queue'

@route('/zap')
export class WhatsAppController {
  #clientsWpp: ClientsWpp
  #conversationService: ConversationService
  #contactService: ContactService
  #syncContacts: typeof SyncContacts

  constructor({ clientsWpp, syncContacts, conversationService, contactService }) {
    this.#clientsWpp = clientsWpp
    this.#conversationService = conversationService
    this.#contactService = contactService
    this.#syncContacts = syncContacts
  }

  @route('/health')
  @GET()
  async health(request: Request, response: Response) {
    try {
      const result = await this.#clientsWpp.health(request.idEmpresa)

      return response.status(200).send(result)
    } catch (err) {
      return response.status(200).send('Desconectado')
    }
  }

  @route('/sync/contacts')
  @POST()
  async syncContacts(request: Request, response: Response) {
    try {
      const result = await this.#clientsWpp.getContacts(request.idEmpresa)

      const contacts = result.filter(e => e.jid).map(c => {
        return new ContactEntity({
          idEmpresa: request.idEmpresa,
          name: c.name || c.pushname || 'Sem nome',
          phone: c.jid.replace(/\D/g, '')
        })
      })

      const chucks = _.chunk(contacts, 20)

      for (const chuck of chucks) {
        await this.#syncContacts.add(
          { contacts: chuck },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000
            }
          }
        )
        
      }
      // await Promise.all(contacts.map(c => this.#contactService.save(c)))

      return response.status(201).json({ imported: contacts.length })
    } catch (err) {
      return response.status(200).send('Desconectado')
    }
  }

  @route('/connect')
  @POST()
  async connect(request: Request, response: Response) {
    await this.#clientsWpp.start(request.idEmpresa)

    return response.status(200).json({})
  }

  @route('/disconnect')
  @GET()
  async disconnect(request: Request, response: Response) {
    await this.#clientsWpp.stop(request.idEmpresa)

    return response.status(200).send()
  }

  @route('/qrcode')
  @GET()
  async getQrCode(request: Request, response: Response) {
    const result = await this.#clientsWpp.qrCode(request.idEmpresa)

    if (result === 'WORKING') {
      return response.status(200).send('')
    }

    if (!result) {
      return response.status(400).json({
        message: 'Ocorreu um erro ao gerar qrcode'
      })
    }

    return response.status(200).send(Buffer.from(result, 'binary').toString('base64'))
  }

  @route('/')
  @POST()
  async webhoook(request: Request, response: Response) {
    const eventsNamesValids = ['message']
    const body = request.body as any
    const idEmpresa = body.session

    if (
      !eventsNamesValids.includes(body.event) ||
      !body.payload.from.includes('@c.us') ||
      body.payload.fromMe
    ) {
      return response.status(200).send()
    }
    const phoneNumber = (body.payload.from.replace('@c.us', '') as string).substring(2)
    const contact = await this.#contactService.findByPhone(idEmpresa, phoneNumber)

    let idContact = null

    if (!contact) {
      const data = body.payload._data
      idContact = await this.#contactService.save({
        idEmpresa,
        name: data.pushName,
        phone: phoneNumber
      })
    } else {
      idContact = contact.id
    }

    const conversation = await this.#conversationService.findConversationByContactNotFinished(idEmpresa, idContact)

    let idConversation = null

    if (!conversation) {
      idConversation = await this.#conversationService.save({
        idContact,
        idEmpresa,
        isRead: true
      })
    } else {
      idConversation = conversation.id
    }


    // dois b.o

    // 1 - O url da midia vem localhost:3000 alterar
    // 2 - o payload quando vem zerado a ultima mensagem qual vai ser?} - Gerei um id (uuid-RANDONUUID)
    // 3 - Salvar messageId para responder (OK)
    // 4 - Quando eu querer uma mensagem especificado eu vou buscar pelo ID da mensagem do zap, e pegar as 10 mensagens antes e 9 depois, e buscar o ultimo registro, e fazer um de para pelo id da mensagem pesquisada e do ultimo, para eu saber como irei páginar, e quantas páginas terá

    await this.#conversationService.updateLastMessage(
      idConversation,
      idEmpresa,
      body.payload.body
    )

    await this.#conversationService.addMessage(
      idEmpresa,
      idConversation,
      null,
      body.payload.body,
      body.payload.id,
      body.payload.hasMedia,
      body.payload?.media?.url
    )

    return response.status(200).send()
  }
}