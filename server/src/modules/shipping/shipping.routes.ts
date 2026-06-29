import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { cotizar, generarEtiqueta, tracking, cancelar, confirmarCancelar, handleShippingError } from './shipping.controller'
import { requireAuth } from '../../middleware/auth'

const router = Router()

// Wrapper que captura ShippingError antes de que llegue al errorHandler global
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err: unknown) => {
      if (!handleShippingError(err, res)) next(err)
    })
  }
}

router.post('/cotizar', asyncHandler(cotizar))               // público — se usa en detalle de producto
router.post('/etiqueta', requireAuth, asyncHandler(generarEtiqueta))
router.post('/cancelar', requireAuth, asyncHandler(cancelar))                    // admin solicita cancelación
router.get('/cancelar-confirmar/:token', asyncHandler(confirmarCancelar))        // público — token actúa como auth
router.post('/tracking', asyncHandler(tracking))             // público — tracking es info pública

export default router
