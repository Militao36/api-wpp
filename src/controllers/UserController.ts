import { GET, POST, route } from 'awilix-express'
import { Request, Response } from 'express'

import { UserService } from '../services/UserService'

@route('/users')
export class UserController {
  #userService: UserService
  constructor ({ userService }) {
    this.#userService = userService
  }

  @POST()
  async save (request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const id = await this.#userService.save({
      ...request.body,
      idEmpresa
    })
    return response.status(201).json({ id })
  }
}