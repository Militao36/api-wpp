import { GET, POST, route } from 'awilix-express'
import { Request, Response } from 'express'

import { ContactService } from '../services/ContactService'

@route('/contacts')
export class ContactController {
  #contactService: ContactService
  constructor ({ contactService }) {
    this.#contactService = contactService
  }

  @POST()
  async save (request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const id = await this.#contactService.save({
      ...request.body,
      idEmpresa
    })
    return response.status(201).json({ id })
  }

  @GET()
  async list (request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const query = request.query

    const data = await this.#contactService.list({ ...query, idEmpresa } as any)
    return response.status(200).json(data)
  }
}