import { Request, Response, NextFunction } from 'express'
import jwt, { SignOptions } from 'jsonwebtoken'


export class Authentication {
  generateToken(data: Record<string, unknown>, expires = 86400) {
    const secret: string = String(process?.env?.SECRET_JWT) || '';

    const options: SignOptions = {
      expiresIn: expires,
    };

    return jwt.sign(data, secret, options)
  }

  async verify(req: Request, res: Response, next: NextFunction) {
    const excludes = [
      '/users/auth',
      '/users/register',
    ]

    if (excludes.includes(req.url)) {
      return next();
    }

    const auth = req.query.auth as string
    const authHeaders = req.headers.authorization || `Bearer ${auth}`;

    if (!authHeaders) {
      return res.status(401).json({
        message: 'Token não passado.'
      })
    }

    if (authHeaders) {
      const token = authHeaders.split(' ')[1];

      if (req.url.includes('/update/password/user')) {
        return handleToken(req, res, next, token)
      }

      return handleToken(req, res, next, token)
    } else {
      return res.status(401).json({})
    }
  }
}

function handleToken(req: Request, res: Response, next: NextFunction, token: string) {
  jwt.verify(token, process.env.SECRET_JWT, async (error, decoded: Record<string, any>) => {
    if (error) {
      return "expiredAt" in error ?
        res.status(401).json({ message: "ERROR_NAME: expired_token - Sessão expirada!" })
        : res.status(401).json({})
    }

    req.idEmpresa = decoded.idEmpresa
    req.isMaster = decoded.isMaster
    req.idUser = decoded.id
    req.username = decoded.username
    req.name = decoded.name

    return next()
  })
}