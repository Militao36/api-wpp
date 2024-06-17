import { GET, POST, before, route } from 'awilix-express'
import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'

import { ConversationUser } from '../repositories/ConversationUsersRepository'
import { ConversationService } from '../services/ConversationService'

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
      idEmpresa
    })
    return response.status(201).json(id)
  }

  /**
   * 
   * @description Essa função vc usa para adicionar usuários/remover (deverá ser passado TODOS usuários)
   *  mesmo se já tiver adiionado, pois ele deleta tudo e cria novamente 
   */
  @route('/add-users')
  @POST()
  @before([(req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      ids: Joi.array().items(Joi.number().required()).required(),
      idConversation: Joi.number().required()
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
  async addUser(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const body = request.body.ids.map((e: any): Partial<ConversationUser> => {
      return {
        idUser: e,
        idConversation: request.body.idConversation,
        idEmpresa
      }
    })

    await this.#conversationService.addUser(body)

    return response.status(201).json()
  }

  @route('/message')
  @POST()
  async message(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const id = await this.#conversationService.message({
      idEmpresa,
      idConversation: request.body.idConversation,
      idUser: request.body.idUser,
      message: request.body.message
    })

    return response.status(201).json({ id })
  }

  @GET()
  @route('/')
  async findAll(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const idUser = request.idUser

    const data = await this.#conversationService.findAll(idEmpresa, idUser)

    return response.status(200).json(data)
  }

  @route('/list-messages/:idConversation')
  @GET()
  async listMessages(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const data = await this.#conversationService
      .listMessages(idEmpresa, Number(request?.params?.idConversation))

    return response.status(200).json(data)
  }
}