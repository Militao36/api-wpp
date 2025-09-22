import { GET, POST, PUT, route } from 'awilix-express'
import { Request, Response } from 'express'

import { SectorService } from '../services/SectorService'

@route('/sectors')
export class SectorController {
  #sectorService: SectorService
  constructor({ sectorService }) {
    this.#sectorService = sectorService
  }

  @route('/')
  @POST()
  async save(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const id = await this.#sectorService.save({
      ...request.body,
      idEmpresa,
    })

    return response.status(201).json({ id })
  }

  @GET()
  async list(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa

    const sectors = await this.#sectorService.list(idEmpresa)

    return response.status(200).json(sectors)
  }

  @route('/:id')
  @GET()
  async findById(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const { id } = request.params

    const sector = await this.#sectorService.findById(id, idEmpresa)

    return response.status(200).json(sector)
  }

  @route('/:id')
  @PUT()
  async update(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa
    const { id } = request.params

    await this.#sectorService.update(id, request.body, idEmpresa)

    return response.status(200).json({ message: 'Setor atualizado com sucesso' })
  }
}