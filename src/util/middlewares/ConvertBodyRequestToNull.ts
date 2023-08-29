import { NextFunction, Request } from 'express'

function convertBodyRequestToNull (request: Request, _, next: NextFunction) {
  if (Object.keys(request.body).length) {
    Object.keys(request.body).forEach((key) => {
      request.body[key] = request.body[key] !== '' ? request.body[key] : null
    })
  }

  return next()
}

export { convertBodyRequestToNull }