import { asClass, asValue, createContainer, InjectionMode } from 'awilix'

import { database } from './util/config/database'
import { CryptoHash } from './util/hash'
import { Logger } from './util/Logger'
import { UserService } from './services/UserService'
import { UserRepository } from './repositories/UserRepository'

const definition = {
    hash: asClass(CryptoHash).singleton(),
    logger: asClass(Logger).singleton(),
    database: asValue(database),

    //services
    userService: asClass(UserService).singleton(),
    //repository
    userRepository: asClass(UserRepository).singleton()
}

const container = createContainer({
    injectionMode: InjectionMode.PROXY
})

container.register(definition)

export default container