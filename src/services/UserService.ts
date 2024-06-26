import {  User, UserRepository } from '../repositories/UserRepository'

export class UserService {
  #userRepository: UserRepository
  constructor ({ userRepository }) {
    this.#userRepository = userRepository
  }

  public async save (user: User): Promise<number> {
    const id = await this.#userRepository.save(user)
    return id
  }
}