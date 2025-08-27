import { GET, POST, PUT, route } from 'awilix-express'
import { Request, Response } from 'express'

import { ContactService } from '../services/ContactService'
import { ClientsWpp } from '../wpp'

@route('/contacts')
export class ContactController {
  #contactService: ContactService
  #clientsWpp: ClientsWpp

  constructor({ contactService, clientsWpp }) {
    this.#contactService = contactService
    this.#clientsWpp = clientsWpp
  }

  @POST()
  async save(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    if (!request.body.phone) {
      return response.status(422).json({ message: 'Phone is required' })
    }

    const phone = await this.#clientsWpp.numberExists(request.body.phone, idEmpresa)

    if (!phone) {
      return response.status(422).json({ message: 'Phone not exists in whatsapp' })
    }
    
    const id = await this.#contactService.save({
      ...request.body,
      idEmpresa,
      isManual: true,
      phone,
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