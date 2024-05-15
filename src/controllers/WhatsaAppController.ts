import { GET, POST, route } from 'awilix-express'
import { Request, Response } from 'express'

import { ClientsWpp } from '../wpp'
import { Conversation } from '../repositories/ConversationRepository'
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

  @route('/send-message')
  @POST()
  async sendMessage(request: Request, response: Response) {
    const body = request.body

    // const listContactsSendSeen = await this.#whatsAppSchema.find({
    //   from: `55${body.phone}@c.us`
    // })

    // for await (const item of listContactsSendSeen) {
    //   await this.#clientsWpp.sendSeen(request.idEmpresa, item.from, item.messageId)
    // }

    await this.#clientsWpp.sendMessage(request.idEmpresa, {
      chatId: body.phone,
      message: body.message
    })

    // Promise.all(listContactsSendSeen.map(e => this.#whatsAppSchema.deleteOne({ _id: e._id })))

    return response.status(200).json({})
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

    if (!eventsNamesValids.includes(body.event)) {
      return response.status(200).send()
    }

    const phoneNumber = body.payload.from as string
    const contact = await this.#contactService.list({
      first: true,
      limit: 1,
      filter: {
        idEmpresa,
        phone: phoneNumber
      }
    })

    let idContact = null

    if (contact?.length === 0) {
      const data = body.payload._data
      idContact = await this.#contactService.save({
        idEmpresa,
        name: data.pushName,
        cellPhone: phoneNumber,
      })
    } else {
      idContact = contact.at(-1).id
    }

    const conversation = await this.#conversationService.list({
      idEmpresa,
      first: true,
      orderBy: 'desc',
      orderByKey: 'createdAt',
      filter: {
        idContact: idContact,
        finishedAt: false
      }
    })

    let idConversation = null

    if (conversation.length === 0) {
      idConversation = await this.#conversationService.save({
        idContact,
        idEmpresa,
      })
    } else {
      idConversation = conversation[0].id
    }

    await this.#conversationService.message({
      idConversation,
      idEmpresa,
      message: body.payload.body,
    })

    return response.status(200).send()
  }
}