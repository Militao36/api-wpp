import express from 'express'
import { loadControllers, scopePerRequest } from 'awilix-express'
import { convertBodyRequestToNull } from './util/middlewares/ConvertBodyRequestToNull'
import { errorHandler } from './util/middlewares/errorHandler'
import cors from 'cors'

import container from './container'

const app = express()

app.use(express.json())
app.use(cors())

app.disable('x-powered-by')

app.use((req, res, next) => {
  req.idEmpresa = '1'
  req.idUser = 'f2c9c99c-1802-4138-b84d-c4814b2f0cb0'
  return next()
})

// middlewares
app.use(scopePerRequest(container))
app.use(convertBodyRequestToNull)
app.use(errorHandler)

app.use(loadControllers(process.env.AWILIX_CONTROLLERS, { cwd: __dirname }))

// api version
app.get('/version', (req, res) => res.status(200).send('1.0.0'))

export default app
