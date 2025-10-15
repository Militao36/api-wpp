import { GET, POST, before, route } from 'awilix-express'
import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'

import { ConversationService } from '../services/ConversationService'
import { ConversationUserEntity } from '../entity/ConversationUserEntity'

@route('/conversations')
export class ConversationController {
  #conversationService: ConversationService

  constructor({ conversationService }) {
    this.#conversationService = conversationService
  }

  @POST()
  async save(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const id = await this.#conversationService.save({
      ...request.body,
      idEmpresa,

    })
    return response.status(201).json({ id })
  }

  @route('/add-users')
  @POST()
  @before([(req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      ids: Joi.array().items(Joi.string().required()).required(),
      idConversation: Joi.string().required()
    })

    const { error } = schema.validate(req.body, {
      allowUnknown: true
    })

    if (error?.details?.length > 0) {
      return res.status(422).json({
        message: 'Schema validation',
        error
      })
    } else {
      return next()
    }
  }])
  async removeAndAddUsers(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const body = request.body.ids.map((e: any): Partial<ConversationUserEntity> => {
      return new ConversationUserEntity({
        idUser: e,
        idConversation: request.body.idConversation,
        idEmpresa
      })
    })

    if (body.length === 0) {
      return response.status(400).json({ message: 'No users to add' })
    }

    await this.#conversationService.removeAndAddUsers(request.idUser, idEmpresa, body)

    return response.status(201).json()
  }

  @route('/message')
  @POST()
  async message(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const message = await this.#conversationService.message({
      idEmpresa,
      idConversation: request.body.idConversation,
      idUser: request.idUser,
      message: request.body.message,
      hasMedia: request?.body?.hasMedia,
      file: request?.body?.file,
      fileName: request?.body?.fileName,
      mimetype: request?.body?.mimetype,
      idContact: request?.body?.idContact
    })

    return response.status(201).json(message)
  }

  @GET()
  @route('/')
  async findAll(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const idUser = request.idUser
    const { filter } = request.query as { filter?: Record<string, string> }

    const data = await this.#conversationService.findAll(idEmpresa, idUser, filter)
    return response.status(200).json(data)
  }

  @POST()
  @route('/transfer/:idUser/:idConversation')
  async transferForUser(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const idUser = request.idUser
    const idUserTransfer = request.params.idUser
    const idConversation = request.params.idConversation
    const trasnferMessages = request.query.trasnferMessages as string

    const data = await this.#conversationService.transfer(idEmpresa, idUser, idUserTransfer, idConversation, trasnferMessages === 'true')

    return response.status(200).json(data)
  }

  @route('/list-messages/:idConversation')
  @GET()
  async listMessages(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const idUser = request.idUser

    const { page } = request.query

    const data = await this.#conversationService
      .listMessages(idEmpresa, request?.params?.idConversation, Number(page))

    return response.status(200).json(data)
  }

  @POST()
  @route('/finish/:id')
  async finishConversation(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const id = request.params.id

    const data = await this.#conversationService.finishConversation(idEmpresa, id)

    return response.status(200).json(data)
  }
}