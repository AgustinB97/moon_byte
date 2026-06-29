import 'dotenv/config'
import './instrument' // Sentry — debe cargarse antes que todo lo demás
import 'express-async-errors' // Debe ir antes de definir rutas: parchea Express para que errores async vayan al errorHandler
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoose from 'mongoose'
import authRoutes from './routes/authRoutes'
import productRoutes from './routes/productRoutes'
import orderRoutes from './routes/orderRoutes'
import adminRoutes from './routes/adminRoutes'
import uploadRoutes from './routes/uploadRoutes'
import enviosRoutes from './routes/enviosRoutes'
import shippingRoutes from './modules/shipping/shipping.routes'
import * as Sentry from '@sentry/node'
import { errorHandler } from './middleware/errorHandler'
import { verifySmtpConnection } from './services/email'

// ── Startup checks ──
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'SMTP_USER', 'SMTP_PASS'] as const
const missing = REQUIRED_ENV.filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error(`[FATAL] Variables de entorno requeridas faltantes: ${missing.join(', ')}`)
  console.error('       Copiá .env.example a .env y completá los valores.')
  process.exit(1)
}

const app = express()
const PORT = Number(process.env.PORT ?? 5000)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

// ── Security headers (CSP, HSTS, X-Frame-Options, etc) ──
// El frontend NO está servido por este server, así que solo necesitamos
// proteger las respuestas JSON de la API. CSP por default es suficiente.
app.use(
  helmet({
    contentSecurityPolicy: false, // El frontend es separado, no servimos HTML
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permitir requests desde el front
  })
)

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Detrás de un proxy (Nginx, Heroku, Vercel), confiar en X-Forwarded-* para rate limiting
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/envios', enviosRoutes)
app.use('/api/shipping', shippingRoutes)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

// 404 handler (después de todas las rutas)
app.use((req, res) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.path}` })
})

// Sentry error handler — debe ir ANTES del errorHandler custom
Sentry.setupExpressErrorHandler(app)

// Error handler (último)
app.use(errorHandler)

// ── Conectar a MongoDB y arrancar ──
async function start() {
  try {
    const uri = process.env.MONGODB_URI!

    // En producción validar que la URI tenga credenciales
    if (process.env.NODE_ENV === 'production') {
      const hasAuth = /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/.test(uri)
      if (!hasAuth) {
        console.error('[DB] ⚠ MONGODB_URI en producción debe incluir usuario y contraseña')
        process.exit(1)
      }
    }

    await mongoose.connect(uri, {
      maxPoolSize: 10,              // máximo 10 conexiones simultáneas
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    })
    console.log('[DB] MongoDB conectado')

    // Verificar SMTP (no bloquea — solo advierte si falla)
    const smtpOk = await verifySmtpConnection()
    console.log(smtpOk ? '[EMAIL] SMTP verificado ✓' : '[EMAIL] ⚠ SMTP no responde — los emails fallarán')

    // Eventos de conexión MongoDB
    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] ⚠ MongoDB desconectado — reintentando...')
    })
    mongoose.connection.on('reconnected', () => {
      console.log('[DB] MongoDB reconectado ✓')
    })

    app.listen(PORT, () => {
      console.log(`[SERVER] Corriendo en http://localhost:${PORT}`)
      console.log(`[CORS] Permitiendo origen: ${CLIENT_ORIGIN}`)
    })
  } catch (err) {
    console.error('[DB] Error de conexión:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

start()

// Graceful shutdown — SIGINT handler
process.on('SIGINT', async () => {
  console.log('\n[SERVER] Cerrando...')
  await mongoose.disconnect()
  process.exit(0)
})
