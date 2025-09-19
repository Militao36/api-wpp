import crypto, { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import { UserEntity } from "../entity/UserEntity"
import { UserRepository } from "../repositories/UserRepository"
import { Authentication } from '../util/middlewares/auth'

export class UserService {
  #userRepository: UserRepository
  #authentication: Authentication
  constructor({ userRepository, authentication }) {
    this.#userRepository = userRepository
    this.#authentication = authentication
  }

  public async auth(userName: string, password: string): Promise<{ user: Partial<UserEntity>, token: string }> {
    const user = await this.#userRepository.findByUserName(userName)

    if (!user) throw new Error('User not found')

    const passwordHash = this.geneteratePasswordHash(password)

    if (user.password !== passwordHash) {
      throw new Error('Invalid password')
    }

    const token = this.#authentication.generateToken({
      idEmpresa: user.idEmpresa,
      id: user.id,
      isMaster: user.isMaster,
      name: user.name,
      username: user.username,
    })

    return {
      user: {
        id: user.id,
        isMaster: Boolean(user.isMaster),
        name: user.name,
        username: user.username,
      },
      token
    }
  }

  public async save(user: UserEntity): Promise<string> {
    const userData = new UserEntity({
      ...user,
      idEmpresa: user.idEmpresa || randomUUID()
    })

    await this.#userRepository.save({
      ...userData,
      password: this.geneteratePasswordHash(userData.password!)
    })
    
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

  public async findMasterUsersByIdEmpresa(idEmpresa: string): Promise<UserEntity[]> {
    const users = await this.#userRepository.findMasterUsersByIdEmpresa(idEmpresa)
    return users
  }

  public async findByUserBot(idEmpresa:string): Promise<UserEntity | null> {
    const user = await this.#userRepository.findByUserBot(idEmpresa)

    return user
  }

  private generateToken(idEmpresa: string, args: object = {}) {
    return jwt.sign({ idEmpresa, ...args }, process.env.SECRET_JWT, {
      expiresIn: 86400 * 30
    })
  }

  private geneteratePasswordHash(password: string) {
    return crypto.createHash('md5').update(password!).digest('hex')
  }
}