import type { Request } from 'express'

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: 'user' | 'admin'
  }
}

export type ProductCategory =
  | 'pcs-armadas'
  | 'procesadores'
  | 'placas-de-video'
  | 'memorias-ram'
  | 'almacenamiento'
  | 'placas-madre'
  | 'gabinetes'
  | 'refrigeracion'
  | 'fuentes'
  | 'monitores'
  | 'perifericos'

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
