import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../types'

/**
 * Double Submit Cookie pattern:
 * - El server setea `csrf-token` como cookie NON-httpOnly al autenticar
 * - El cliente lee esa cookie y la envía como header `X-CSRF-Token` en cada request mutante
 * - El server valida que el header coincida con la cookie
 *
 * Protege contra CSRF porque un sitio malicioso no puede leer la cookie (same-origin policy)
 * y por lo tanto no puede construir el header correcto.
 */
export function requireCsrf(req: AuthRequest, res: Response, next: NextFunction): void {
  const headerToken = req.headers['x-csrf-token'] as string | undefined
  const cookieToken = req.cookies?.['csrf-token'] as string | undefined

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    res.status(403).json({ message: 'CSRF token inválido o ausente' })
    return
  }

  next()
}
