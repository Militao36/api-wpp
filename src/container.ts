import { asClass, asValue, createContainer, InjectionMode } from 'awilix'

import { ConversationRepository } from './repositories/ConversationRepository'
import { ContactRepository } from './repositories/ContactRepository'
import { ConversationService } from './services/ConversationService'
import { UserRepository } from './repositories/UserRepository'
import { ContactService } from './services/ContactService'
import { UserService } from './services/UserService'
import { database } from './util/config/database'
import { CryptoHash } from './util/hash'
import { Logger } from './util/Logger'
import { ConversationUsersRepository } from './repositories/ConversationUsersRepository'
import { ConversationMessageRepository } from './repositories/ConversationMessageRepository'
import { ClientsWpp } from './wpp'

const definition = {
    hash: asClass(CryptoHash).singleton(),
    logger: asClass(Logger).singleton(),
    database: asValue(database),
    clientsWpp: asClass(ClientsWpp).singleton(),
    //services
    userService: asClass(UserService).singleton(),
    contactService: asClass(ContactService).singleton(),
    conversationService: asClass(ConversationService).singleton(),
    
    //repository
    userRepository: asClass(UserRepository).singleton(),
    contactRepository: asClass(ContactRepository).singleton(),
    conversationRepository: asClass(ConversationRepository).singleton(),
    conversationUsersRepository: asClass(ConversationUsersRepository).singleton(),
    conversationMessageRepository: asClass(ConversationMessageRepository).singleton(),
}

const container = createContainer({
    injectionMode: InjectionMode.PROXY
})

container.register(definition)

export default container