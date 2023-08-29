import { NextFunction, Request, Response } from 'express'

function errorHandler (err: any, _: Request, res: Response, next: NextFunction) {
  return res.status(err.statusCode || 500).json({
    error: err.message
  })
}

export { errorHandler }