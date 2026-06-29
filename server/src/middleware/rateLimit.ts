import rateLimit, { type Options } from 'express-rate-limit'

/**
 * Rate limiters por tipo de endpoint.
 *
 * Cada límite cuenta requests por IP (default).
 * En producción detrás de proxy, asegurarse de configurar
 * `app.set('trust proxy', 1)` para que use el X-Forwarded-For real.
 */

const baseOptions: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
}

/** Auth strict — login, register, reset (5 intentos / 15 min) */
export const authStrict = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { message: 'Demasiados intentos. Esperá 15 minutos antes de reintentar.' },
})

/** Auth normal — me, resend, etc (20 / 5 min) */
export const authNormal = rateLimit({
  ...baseOptions,
  windowMs: 5 * 60 * 1000,
  limit: 20,
})

/** Checkout — 10 intentos por 10 minutos */
export const checkoutLimit = rateLimit({
  ...baseOptions,
  windowMs: 10 * 60 * 1000,
  limit: 10,
})

/** API general — 100 / 15 min para cualquier ruta */
export const apiGeneral = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 100,
})
