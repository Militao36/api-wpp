/* eslint-disable no-unused-vars */
import { type Edge } from 'edge.js'

declare global {
  namespace Express {
    interface Request {
      idEmpresa?: string
      idUser?: number
      edge?: Edge
    }
  }
}