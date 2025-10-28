import { GET, POST, PUT, route } from 'awilix-express'
import { Request, Response } from 'express'

import { ContactService } from '../services/ContactService'

@route('/contacts')
export class ContactController {
  #contactService: ContactService
  constructor({ contactService }) {
    this.#contactService = contactService
  }

  @POST()
  async save(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const id = await this.#contactService.save({
      ...request.body,
      idEmpresa,
      isManual: true
    })

    return response.status(201).json({ id })
  }

  @route('/:id')
  @PUT()
  async update(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const { id } = request.params

    await this.#contactService.update(id, idEmpresa, {
      ...request.body,
      idEmpresa,
      isManual: true
    })

    return response.status(204).send()
  }

  @GET()
  async findAll(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const contacts = await this.#contactService.findAll(idEmpresa)
    return response.status(200).json(contacts)
  }

  @route('/:id')
  @GET()
  async findById(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const { id } = request.params

    const contacts = await this.#contactService.findById(idEmpresa, id)
    return response.status(200).json(contacts)
  }
}
