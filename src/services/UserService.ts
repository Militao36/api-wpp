import { FilterUserRepository, UserRepository } from '../repositories/UserRepository'
import { UserEntity } from '../entities/UserEntity'

export class UserService {
  #userRepository: UserRepository
  constructor({ userRepository }) {
    this.#userRepository = userRepository
  }

  public async save(user: UserEntity): Promise<string> {
    await this.#userRepository.save(user)
    return user.id
  }

  public async list(filter: FilterUserRepository) {
    return this.#userRepository.list(filter)
  }
}