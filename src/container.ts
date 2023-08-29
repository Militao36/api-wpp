import { asClass, asValue, createContainer, InjectionMode, Lifetime } from 'awilix'
import Emittery from 'emittery'

import { prisma } from './util/config/database'
import { CryptoHash } from './util/hash'
import { Logger } from './util/Logger'

const definition = {
    prisma: asValue(prisma),
    hash: asClass(CryptoHash).singleton(),
    logger: asClass(Logger).singleton(),
    emittery: asClass(Emittery).singleton()
}

const container = createContainer({
    injectionMode: InjectionMode.PROXY
})

container.loadModules(
    [
        [process.env.AWILIX_SERVICES, Lifetime.SINGLETON]
    ]
)

container.loadModules(
    [
        [process.env.AWILIX_REPOSITORIES, Lifetime.SINGLETON]
    ]
)

container.register(definition)

export default container