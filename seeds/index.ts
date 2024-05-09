import { Knex } from 'knex'

async function seedUser (knex: Knex) {
  await knex('users').del()

  const data = [
    ({ id: 1, idEmpresa: '1', username: 'Matheus 1', password: 'pw', isMaster: true, name: 'Matheus' }),
    ({ id: 2, idEmpresa: '1', username: 'Matheus 2', password: 'pw', isMaster: false, name: 'Matheus 2' }),
    ({ id: 3, idEmpresa: '1', username: 'Carla 1', password: 'pw', isMaster: false, name: 'Carla 1' }),
    ({ id: 4, idEmpresa: '1', username: 'Carla 2', password: 'pw', isMaster: false, name: 'Carla 2' })
  ]

  await knex('users').insert(data)
}

async function seedSector (knex: Knex) {
  await knex('sectors').del()

  const data = [
    ({ id: 1, idEmpresa: '1', name: 'Programação' }),
    ({ id: 2, idEmpresa: '1', name: 'Suporte' }),
    ({ id: 3, idEmpresa: '1', name: 'Vendas' }),
    ({ id: 4, idEmpresa: '1', name: 'Financero' })
  ]

  await knex('sectors').insert(data)
}

async function seedUserSector (knex: Knex) {
  await knex('user_sector').del()

  const data = [
    ({ id: 1, idEmpresa: '1', idUser: 1, idSector: 1 }),
    ({ id: 2, idEmpresa: '1', idUser: 2, idSector: 2 }),
    ({ id: 3, idEmpresa: '1', idUser: 3, idSector: 3 }),
    ({ id: 4, idEmpresa: '1', idUser: 4, idSector: 4 })
  ]

  await knex('user_sector').insert(data)
}

async function seedContacts (knex: Knex) {
  await knex('contacts').del()

  const data = [
    ({ id: 1, idEmpresa: '1', name: 'name 1', phone: '31996508625', cellPhone: '31996508625', email: 'teste@gmail.com' }),
    ({ id: 2, idEmpresa: '1', name: 'name 2', phone: '31996508625', cellPhone: '31996508625', email: 'teste@gmail.com' }),
    ({ id: 3, idEmpresa: '1', name: 'name 3', phone: '31996508625', cellPhone: '31996508625', email: 'teste@gmail.com' }),
    ({ id: 4, idEmpresa: '1', name: 'name 4', phone: '31996508625', cellPhone: '31996508625', email: 'teste@gmail.com' })
  ]

  await knex('contacts').insert(data)
}

async function seedConversations (knex: Knex) {
  await knex('conversations').del()

  const data = [
    ({ id: 1, idEmpresa: '1', idContact: 1, idPreviousConversation: null, finishedAt: null }),
    ({ id: 2, idEmpresa: '1', idContact: 2, idPreviousConversation: null, finishedAt: null }),
    ({ id: 3, idEmpresa: '1', idContact: 3, idPreviousConversation: null, finishedAt: null }),
    ({ id: 4, idEmpresa: '1', idContact: 4, idPreviousConversation: null, finishedAt: null })
  ]

  await knex('conversations').insert(data)
}

async function seedConversationsUsers (knex: Knex) {
  await knex('conversation_users').del()

  const data = [
    ({ id: 1, idEmpresa: '1', idUser: 1, idConversation: 1 }),
    ({ id: 2, idEmpresa: '1', idUser: 2, idConversation: 2 }),
    ({ id: 3, idEmpresa: '1', idUser: 3, idConversation: 3 }),
    ({ id: 4, idEmpresa: '1', idUser: 4, idConversation: 4 })
  ]

  await knex('conversation_users').insert(data)
}

async function seedConversationsUsersMessages (knex: Knex) {
  await knex('conversation_message').del()

  const data = [
    ({ id: 1, idEmpresa: '1', idUser: 1, idConversation: 1, message: 'menagem teste' }),
    ({ id: 2, idEmpresa: '1', idUser: 2, idConversation: 2, message: 'menagem teste' }),
    ({ id: 3, idEmpresa: '1', idUser: 3, idConversation: 3, message: 'menagem teste' }),
    ({ id: 4, idEmpresa: '1', idUser: 4, idConversation: 4, message: 'menagem teste' })
  ]

  await knex('conversation_message').insert(data)
}

export async function seed (knex: Knex): Promise<void> {
  await seedUser(knex)
  await seedSector(knex)
  await seedUserSector(knex)
  await seedContacts(knex)
  await seedConversations(knex)
  await seedConversationsUsers(knex)
  await seedConversationsUsersMessages(knex)
};
