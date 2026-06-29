import crypto from 'crypto'

/**
 * Genera un par (rawToken, hashedToken).
 *
 *  - `raw` → es lo que va al usuario en el link del email (ej. /verify/abc123...)
 *  - `hashed` → es lo que guardamos en la DB
 *
 * Así, aunque alguien tenga acceso a la DB, no puede usar los tokens
 * para impersonar usuarios. Cuando el user hace click en el link,
 * hasheamos lo que viene en la URL y buscamos por el hash.
 */
export function generateToken(): { raw: string; hashed: string } {
  const raw = crypto.randomBytes(32).toString('hex')
  const hashed = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hashed }
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/**
 * Helper para chequear si un Date está expirado.
 */
export function isExpired(date: Date | undefined): boolean {
  if (!date) return true
  return date.getTime() < Date.now()
}

/**
 * Tiempos de expiración por defecto.
 */
export const TOKEN_TTL = {
  VERIFICATION: 24 * 60 * 60 * 1000, // 24 hs
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hora
} as const
