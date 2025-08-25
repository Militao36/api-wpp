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
}