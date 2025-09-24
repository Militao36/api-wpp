import { asClass, asValue, createContainer, InjectionMode } from 'awilix'

import { Authentication } from './util/middlewares/auth'
import { AwsService } from './services/AwsService'
import { clientRedis } from './util/config/redis'
import { ClientsWpp } from './wpp'
import { ContactRepository } from './repositories/ContactRepository'
import { ContactService } from './services/ContactService'
import { ConversationMessageRepository } from './repositories/ConversationMessageRepository'
import { ConversationRepository } from './repositories/ConversationRepository'
import { ConversationService } from './services/ConversationService'
import { ConversationUsersRepository } from './repositories/ConversationUsersRepository'
import { CryptoHash } from './util/hash'
import { database } from './util/config/database'
import { Logger } from './util/Logger'
import { SectorRepository } from './repositories/SectorRepository'
import { SectorService } from './services/SectorService'
import { SyncContacts } from './queue'
import { UserRepository } from './repositories/UserRepository'
import { UserService } from './services/UserService'
import { WhatsWppService } from './services/WhatsWppService'

const definition = {
    hash: asClass(CryptoHash).singleton(),
    logger: asClass(Logger).singleton(),
    database: asValue(database),
    clientsWpp: asClass(ClientsWpp).singleton(),
    clientRedis: asValue(clientRedis),
    authentication: asClass(Authentication).singleton(),
    //services
    userService: asClass(UserService).singleton(),
    contactService: asClass(ContactService).singleton(),
    conversationService: asClass(ConversationService).singleton(),
    awsService: asClass(AwsService).singleton(),
    sectorService: asClass(SectorService).singleton(),
    whatsWppService: asClass(WhatsWppService).singleton(),

    //repository
    userRepository: asClass(UserRepository).singleton(),
    contactRepository: asClass(ContactRepository).singleton(),
    conversationRepository: asClass(ConversationRepository).singleton(),
    conversationUsersRepository: asClass(ConversationUsersRepository).singleton(),
    conversationMessageRepository: asClass(ConversationMessageRepository).singleton(),
    sectorRepository: asClass(SectorRepository).singleton(),
    // queue filas
    syncContacts: asValue(SyncContacts)
}

const container = createContainer({
    injectionMode: InjectionMode.PROXY
})

container.register(definition)

export default container