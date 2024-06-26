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
  async findAll (request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const contacts = await this.#contactService.findAll(idEmpresa)
    return response.status(200).json(contacts)
  }

  @route('/:id')
  @GET()
  async findById (request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const { id } = request.params

    const contacts = await this.#contactService.findById(idEmpresa, Number(id))
    return response.status(200).json(contacts)
  }
}