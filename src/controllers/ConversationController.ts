import { GET, POST, route } from 'awilix-express'
import { Request, Response } from 'express'

import { ConversationService } from '../services/ConversationService'
import { ConversationEntity } from '../entities/ConversationEntity'

@route('/conversations')
export class ConversationController {
  #conversationService: ConversationService
  constructor({ conversationService }) {
    this.#conversationService = conversationService
  }

  @POST()
  async save(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const conversation = new ConversationEntity({
      ...request.body,
      idEmpresa
    })

    const id = await this.#conversationService.save(conversation)
    return response.status(201).json({ id })
  }

  @GET()
  async list(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const query = request.query

    const data = await this.#conversationService.list({ ...query, idEmpresa } as any)
    return response.status(200).json(data)
  }
}