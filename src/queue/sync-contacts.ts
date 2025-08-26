import { randomUUID } from 'crypto'
import Queue from 'bull'

import { ContactService } from '../services/ContactService'
import { ContactEntity } from '../entity/ContactEntity'
import { AwsService } from '../services/AwsService'
import container from '../container'
import { ClientsWpp } from '../wpp'

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

    const contactService = container.resolve<ContactService>('contactService')
    const clientsWpp = container.resolve<ClientsWpp>('clientsWpp')
    const awsService = container.resolve<AwsService>('awsService')

    for await (const contact of data.contacts) {
      const urlProfile = await clientsWpp.getUrlProfileByContact(contact.idEmpresa, contact.phone)

      const fileName = `${randomUUID()}.jpg`
      const upload = await awsService.uploadFile(urlProfile, fileName, process.env.BUCKET_NAME)

      await contactService.save({
        ...contact,
        urlProfile: upload?.url || null,
        isManual: false
      })

      console.log('Contato salvo', contact.phone)
    }
    console.log('Finaizado excutação de job', SyncContacts.name)
  } catch (error) {
    console.log('Job com error', error)
  }
})
