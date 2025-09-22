import { SectorEntity } from '../entity/SectorEntity'
import { SectorRepository } from '../repositories/SectorRepository'

export class SectorService {
  #sectorRepository: SectorRepository

  constructor({ sectorRepository }) {
    this.#sectorRepository = sectorRepository
  }

  public async save(sector: SectorEntity): Promise<string> {
    const sectorData = new SectorEntity({
      ...sector,
    })

    await this.#sectorRepository.save({
      ...sectorData,
    })

    return sectorData.id!
  }

  public async update(id: string, sector: Partial<SectorEntity>, idEmpresa: string): Promise<void> {
    const existingSector = await this.#sectorRepository.findById(id, idEmpresa)

    if (!existingSector) throw new Error('Sector not found')

    const updatedSector = {
      ...existingSector,
      ...sector,
    }

    await this.#sectorRepository.update(updatedSector, id, idEmpresa)
  }

  public async findById(id: string, idEmpresa: string): Promise<SectorEntity> {
    const sector = await this.#sectorRepository.findById(id, idEmpresa)

    if (!sector) throw new Error('Sector not found')

    return sector
  }

  public async list(idEmpresa: string): Promise<SectorEntity[]> {
    const sectors = await this.#sectorRepository.findAll(idEmpresa)
    return sectors
  }
}