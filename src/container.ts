import { asClass, asValue, createContainer, InjectionMode } from 'awilix'

import { ConversationRepository } from './repositories/ConversationRepository'
import { ContactRepository } from './repositories/ContactRepository'
import { ConversationService } from './services/ConversationService'
import { UserRepository } from './repositories/UserRepository'
import { ContactService } from './services/ContactService'
import { UserService } from './services/UserService'
import { SectorService } from './services/SectorService'
import { BotService } from './services/BotService'

import { ConversationUsersRepository } from './repositories/ConversationUsersRepository'
import { ConversationMessageRepository } from './repositories/ConversationMessageRepository'
import { SectorRepository } from './repositories/SectorRepository'

import { ClientsWpp } from './wpp'
import { SyncContacts } from './queue'
import { AwsService } from './services/AwsService'
import { clientRedis } from './util/config/redis'
import { Authentication } from './util/middlewares/auth'
import { database } from './util/config/database'
import { CryptoHash } from './util/hash'
import { Logger } from './util/Logger'

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
    botService: asClass(BotService).singleton(),

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