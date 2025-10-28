import { NextFunction, Request, Response } from 'express'

function errorHandler (err: any, _: Request, res: Response, next: NextFunction) {
  if (err?.config?.url.includes('https://mysql-wpp.jbvwrb.easypanel.host')) {
    return res.status(err.response.status || 500).json({
      error: err.response.data.message
    })
  }

  return res.status(err.statusCode || 500).json({
    error: err.message
  })
}

export { errorHandler }