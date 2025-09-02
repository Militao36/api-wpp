import { UserEntity } from "../entity/UserEntity"
import { UserRepository } from "../repositories/UserRepository"

export class UserService {
  #userRepository: UserRepository
  constructor({ userRepository }) {
    this.#userRepository = userRepository
  }

  public async save(user: UserEntity): Promise<string> {
    const userData = new UserEntity(user)

    await this.#userRepository.save(userData)
    return userData.id!
  }

  public async findById(id: string, idEmpresa: string): Promise<UserEntity> {
    const user = await this.#userRepository.findById(id, idEmpresa)
    if (!user) throw new Error('User not found')
    return user
  }

  public async list(idEmpresa: string): Promise<UserEntity[]> {
    const users = await this.#userRepository.findAll(idEmpresa)

    return users
  }
}