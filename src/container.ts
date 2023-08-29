import { asClass, asValue, createContainer, InjectionMode } from 'awilix'

import { database } from './util/config/database'
import { CryptoHash } from './util/hash'
import { Logger } from './util/Logger'
import { UserService } from './services/UserService'
import { UserRepository } from './repositories/UserRepository'
import { ContactService } from './services/ContactService'
import { ContactRepository } from './repositories/ContactRepository'

const definition = {
    hash: asClass(CryptoHash).singleton(),
    logger: asClass(Logger).singleton(),
    database: asValue(database),
    //services
    userService: asClass(UserService).singleton(),
    contactService: asClass(ContactService).singleton(),
    //repository
    userRepository: asClass(UserRepository).singleton(),
    contactRepository: asClass(ContactRepository).singleton(),
}

const container = createContainer({
    injectionMode: InjectionMode.PROXY
})

container.register(definition)

export default container