import { POST, route } from 'awilix-express'
import { Request, Response } from 'express'

import { UserService } from '../services/UserService'
import { UserEntity } from '../entities/UserEntity'

@route('/users')
export class UserController {
  #userService: UserService
  constructor({ userService }) {
    this.#userService = userService
  }

  @POST()
  async save(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const user = new UserEntity({
      ...request.body,
      idEmpresa
    })

    const id = await this.#userService.save(user)
    return response.status(201).json({ id })
  }
}