import { Router } from 'express'
import { cotizarEnvio } from '../controllers/enviosController'

const router = Router()

// Pública — cotizar envío no requiere login (se usa en detalle de producto)
router.post('/cotizar', cotizarEnvio)

export default router
