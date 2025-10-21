import { randomUUID } from 'crypto'
import Queue from 'bull'

import { ContactService } from '../services/ContactService'
import { ContactEntity } from '../entity/ContactEntity'
import { AwsService } from '../services/AwsService'
import container from '../container'
import { ClientsWpp } from '../wpp'
import { ConversationService } from '../services/ConversationService'
import { UserService } from '../services/UserService'
import { ConversationMessageRepository } from '../repositories/ConversationMessageRepository'
import { ConversationMessageEntity } from '../entity/ConversationMessageEntity'
import { DateTime } from 'luxon'
import { ContactRepository } from '../repositories/ContactRepository'
import { SectorService } from '../services/SectorService'
import { SectorsDefault } from '../entity/SectorEntity'

export const SyncContacts = new Queue('queue-sync-contacts', {
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD
  }
})

SyncContacts.process(async (job) => {
  try {
    console.log('Iniciando executação de job', SyncContacts.name)
    const data = job.data as { contacts: ContactEntity[] }

    const conversationService = container.resolve<ConversationService>('conversationService')
    const contactService = container.resolve<ContactService>('contactService')
    const contactRepository = container.resolve<ContactRepository>('contactRepository')
    const userService = container.resolve<UserService>('userService')
    const clientsWpp = container.resolve<ClientsWpp>('clientsWpp')
    const conversationMessageRepository = container.resolve<ConversationMessageRepository>('conversationMessageRepository')

    for await (const contact of data.contacts) {
      const urlProfile = await clientsWpp.getUrlProfileByContact(contact.idEmpresa, contact.phone)

      // if(!urlProfile){
      //   console.log('Contato sem foto de perfil', contact.phone)
      //   continue
      // }

      // const fileName = `${contact.id}-profile.jpg`
      // const upload = await awsService.uploadFile(urlProfile, fileName, process.env.BUCKET_NAME)
      const phone = await conversationService.formatChatId(contact.idEmpresa, contact.phone.replace('@c.us', '').substring(2))

      if (!phone) {
        continue;
      }

      const exists = await contactService.findByPhone(contact.idEmpresa, phone)

      if (exists) {
        await contactService.update(exists.id, contact.idEmpresa, {
          ...exists,
          urlProfile: urlProfile || null,
          isManual: false,
          name: contact.name || exists.name,
        })
        continue
      }

      const newContact = new ContactEntity({
        ...contact,
        urlProfile: urlProfile || null,
        isManual: false,
        phone,
      })

      const idContact = newContact.id!

      await contactRepository.save(newContact)

      const userMaster = await userService.findMasterUsersByIdEmpresa(contact.idEmpresa)
      const messagesByChatId = await clientsWpp.getMessagesByChatId(contact.idEmpresa, `55${phone}@c.us`)

      const { id: idConversaiton } = await conversationService.findOrCreateConversation(contact.idEmpresa, idContact, userMaster[0].id)

      for await (const message of messagesByChatId) {
        if (!message.body) {
          console.log(message)
        }
        await conversationMessageRepository.save({
          id: randomUUID(),
          idConversation: idConversaiton,
          idEmpresa: contact.idEmpresa,
          idUser: message.fromMe ? userMaster?.[0]?.id : null,
          message: message.body || '',
          createdAt: DateTime.fromSeconds(message.timestamp).setZone("America/Sao_Paulo").toISO(),
          updatedAt: DateTime.fromSeconds(message.timestamp).setZone("America/Sao_Paulo").toISO(),
        })
      }

      console.log('Contato salvo', contact.phone)
    }
    console.log('Finaizado excutação de job', SyncContacts.name)
  } catch (error) {
    console.log('Job com error', error)
  }
})
