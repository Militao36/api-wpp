import { GET, POST, route } from 'awilix-express'
import { Request, Response } from 'express'

import { ClientsWpp } from '../wpp'
import { ConversationService } from '../services/ConversationService'
import { ContactService } from '../services/ContactService'

@route('/zap')
export class WhatsAppController {
  #clientsWpp: ClientsWpp
  #conversationService: ConversationService
  #contactService: ContactService

  constructor({ clientsWpp, conversationService, contactService }) {
    this.#clientsWpp = clientsWpp
    this.#conversationService = conversationService
    this.#contactService = contactService
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

  @route('/connect')
  @POST()
  async connect(request: Request, response: Response) {
    await this.#clientsWpp.start(request.idEmpresa)

    return response.status(200).json({})
  }

  @route('/health/:id')
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

    if (!eventsNamesValids.includes(body.event) || body.payload.from.includes('@g.us')) {
      return response.status(200).send()
    }
    const phoneNumber = body.payload.from.replace('@c.us', '') as string
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
      idConversation = conversation[0].id
    }

    await this.#conversationService.updateLastMessage(
      idConversation,
      idEmpresa,
      body.payload.body
    )

    await this.#conversationService.message({
      idConversation,
      idEmpresa,
      message: body.payload.body
    })

    return response.status(200).send()
  }
}