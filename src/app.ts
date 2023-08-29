import express from 'express'
import { loadControllers, scopePerRequest } from 'awilix-express'
import { convertBodyRequestToNull } from './util/middlewares/ConvertBodyRequestToNull'
import { errorHandler } from './util/middlewares/errorHandler'

import container from './container'

const app = express()

app.use(express.json())

app.disable('x-powered-by')

// middlewares
app.use(scopePerRequest(container))
app.use(convertBodyRequestToNull)
app.use(errorHandler)

app.use(loadControllers(process.env.AWILIX_CONTROLLERS, { cwd: __dirname }))

// api version
app.get('/version', (req, res) => res.status(200).send('1.0.0'))

export default app
