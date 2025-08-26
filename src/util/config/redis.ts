import 'dotenv/config'

import { createClient } from 'redis';

const clientRedis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: 6379,
    connectTimeout: 1000000
  }
});

clientRedis.connect();

export { clientRedis }