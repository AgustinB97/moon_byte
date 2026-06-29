import type { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthRequest } from '../types'

interface JwtPayload {
  id: string
  role: 'user' | 'admin'
}

interface TotpStepPayload {
  id: string
  step: 'totp'
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  // Primero intentar desde cookie httpOnly, luego Bearer header como fallback (API clients)
  const cookieToken = req.cookies?.['auth-token'] as string | undefined
  const bearerHeader = req.headers.authorization
  const token = cookieToken ?? (bearerHeader?.startsWith('Bearer ') ? bearerHeader.slice(7) : undefined)

  if (!token) {
    res.status(401).json({ message: 'Token requerido' })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    req.user = { id: payload.id, role: payload.role }
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

/** Middleware para el paso 2 del login con 2FA — valida el totpToken temporal */
export function requireTotpStep(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (!token) {
    res.status(401).json({ message: 'Token TOTP requerido' })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TotpStepPayload
    if (payload.step !== 'totp') {
      res.status(401).json({ message: 'Token inválido para este paso' })
      return
    }
    req.user = { id: payload.id, role: 'admin' }
    next()
  } catch {
    res.status(401).json({ message: 'Token TOTP inválido o expirado' })
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'Token requerido' })
    return
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Acceso denegado: se requiere rol admin' })
    return
  }
  next()
}
