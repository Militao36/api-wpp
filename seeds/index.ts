import { Knex } from "knex";

async function seedUser(knex: Knex) {
    await knex("users").del();

    const data = [
        ({ id: 1, idEmpresa: '1', username: 'Matheus 1', password: 'pw', isMaster: true, name: 'Matheus' }),
        ({ id: 2, idEmpresa: '1', username: 'Matheus 2', password: 'pw', isMaster: false, name: 'Matheus 2' }),
        ({ id: 3, idEmpresa: '1', username: 'Carla 1', password: 'pw', isMaster: false, name: 'Carla 1' }),
        ({ id: 4, idEmpresa: '1', username: 'Carla 2', password: 'pw', isMaster: false, name: 'Carla 2' }),
    ]

    await knex("users").insert(data);
}

async function seedSector(knex: Knex) {
    await knex("sectors").del();

    const data = [
        ({ id: 1, idEmpresa: '1', name: 'Programação' }),
        ({ id: 2, idEmpresa: '1', name: 'Suporte' }),
        ({ id: 3, idEmpresa: '1', name: 'Vendas' }),
        ({ id: 4, idEmpresa: '1', name: 'Financero' }),
    ]

    await knex("sectors").insert(data);
}

async function seedUserSector(knex: Knex) {
    await knex("user_sector").del();

    const data = [
        ({ id: 1, idEmpresa: '1', idUser: 1, idSector: 1 }),
        ({ id: 2, idEmpresa: '1', idUser: 2, idSector: 2 }),
        ({ id: 3, idEmpresa: '1', idUser: 3, idSector: 3 }),
        ({ id: 4, idEmpresa: '1', idUser: 4, idSector: 4 }),
    ]

    await knex("user_sector").insert(data);
}

export async function seed(knex: Knex): Promise<void> {
    await seedUser(knex)
    await seedSector(knex)
    await seedUserSector(knex)
};
