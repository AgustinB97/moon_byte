import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',

  // Solo activar si hay DSN configurado
  enabled: !!process.env.SENTRY_DSN,

  // Capturar el 100% de transacciones en dev, 10% en producción
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})
