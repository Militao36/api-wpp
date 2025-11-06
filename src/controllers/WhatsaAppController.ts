import { GET, POST, route } from 'awilix-express'
import { Request, Response } from 'express'
import _ from 'lodash'

import { ClientsWpp } from '../wpp'
import { ContactEntity } from '../entity/ContactEntity'
import { SyncContacts } from '../queue'
import { RedisClientType } from 'redis'
import { DateTime } from 'luxon'
import { WhatsWppService } from '../services/WhatsWppService'
import { UserService } from '../services/UserService'

@route('/zap')
export class WhatsAppController {
  #clientsWpp: ClientsWpp
  #syncContacts: typeof SyncContacts
  #clientRedis: RedisClientType
  #whatsWppService: WhatsWppService
  #userService: UserService

  constructor({ userService, whatsWppService, clientRedis, clientsWpp, syncContacts }) {
    this.#clientsWpp = clientsWpp
    this.#syncContacts = syncContacts
    this.#clientRedis = clientRedis
    this.#whatsWppService = whatsWppService
    this.#userService = userService
  }

  @route('/health')
  @GET()
  async health(request: Request, response: Response) {
    try {
      const result = await this.#clientsWpp.health(request.idEmpresa)

      return response.status(200).send(result)
    } catch (err) {
      return response.status(200).send('Desconectado')
    }
  }

  @route('/sync/contacts')
  @POST()
  async syncContacts(request: Request, response: Response) {
    try {
      const sync = await this.#clientRedis.get(`sync-contacts-${request.idEmpresa}`)

      if (sync) {
        return response.status(200).json({ message: 'Aguarde, sincronização em andamento' })
      }

      const lastSync = await this.#clientRedis.get(`last-sync-contacts-${request.idEmpresa}`) as string

      if (lastSync) {
        const lastSyncDate = DateTime.fromISO(lastSync)
        const now = DateTime.local()
        const diffDays = now.diff(lastSyncDate, 'days').days

        if (diffDays < 1) {
          return response.status(200).json({ message: 'Sincronização realizada a menos de 24 horas' })
        }
      }

      const result = await this.#clientsWpp.getContacts(request.idEmpresa)

      await this.#clientRedis.set(`sync-contacts-${request.idEmpresa}`, 'true')

      const contacts = result.filter(e => !!e.pushname).filter(e => e.name !== '447876137368').map(c => {
        return new ContactEntity({
          idEmpresa: request.idEmpresa,
          name: c.name || c.pushname || 'Sem nome',
          phone: c.id.replace(/\D/g, '')
        })
      })

      const chucks = _.chunk(contacts, 20)

      for (const chuck of chucks) {
        await this.#syncContacts.add(
          { contacts: chuck },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000
            },
            removeOnComplete: true,
          }
        )
      }

      await this.#clientRedis.del(`sync-contacts-${request.idEmpresa}`)

      await this.#clientRedis.set(`last-sync-contacts-${request.idEmpresa}`, DateTime.local().toISO())

      return response.status(201).json({ imported: contacts.length, contacts: result })
    } catch (err) {
      console.log(err)
      return response.status(200).send('Desconectado')
    }
  }

  @route('/connect')
  @POST()
  async connect(request: Request, response: Response) {
    await this.#clientsWpp.start(request.idEmpresa)

    return response.status(200).json({})
  }

  @route('/disconnect')
  @GET()
  async disconnect(request: Request, response: Response) {
    await this.#clientsWpp.stop(request.idEmpresa)

    return response.status(200).send()
  }

  @route('/qrcode')
  @GET()
  async getQrCode(request: Request, response: Response) {
    const result = await this.#clientsWpp.qrCode(request.idEmpresa)

    if (result === 'WORKING') {
      return response.status(200).send('')
    }

    if (!result) {
      return response.status(400).json({
        message: 'Ocorreu um erro ao gerar qrcode'
      })
    }

    return response.status(200).send(Buffer.from(result, 'binary').toString('base64'))
  }

  @route('/webhook')
  @POST()
  async webhoook(request: Request, response: Response) {
    const eventsNamesValids = ['message', 'message.any', 'message.ack']
    const body = request.body as any
    const idEmpresa = body.session

    console.log('Webhook recebido:', body)

    if (!eventsNamesValids.includes(body.event)) {
      return response.status(200).send()
    }

    if (!body.payload.from.includes('@c.us')) {
      return response.status(200).send()
    }

    if (body.event === 'message.ack' && body.payload.ackName === 'READ') {
      await this.#whatsWppService.ack(idEmpresa, body)
    } else if (body.event === 'message') {

      if (body.payload.fromMe) {
        console.log('Mensagem enviada pelo próprio número, ignorando')
        console.log(body.payload)

        const users = await this.#userService.findMasterUsersByIdEmpresa(idEmpresa)

        if (users.length === 0) {
          return response.status(200).send()
        }

        await this.#whatsWppService.handle(idEmpresa, body, users[0].id)

        return response.status(200).send()
      }

      if (body.me.id === body.payload.from) {
        return response.status(200).send()
      }

      await this.#whatsWppService.handle(idEmpresa, body)
    }


    return response.status(200).send()
  }

}