import { Router } from 'express'
import {
  createOrder,
  startCheckout,
  confirmOrder,
  mpWebhook,
  getMyOrders,
  getOrderById,
  getOrderTracking,
  submitTransferProof,
} from '../controllers/orderController'
import { requireAuth } from '../middleware/auth'
import { checkoutLimit } from '../middleware/rateLimit'

const router = Router()

// Webhook público (MP llama acá; protegido por HMAC signature en el controller)
router.post('/webhook', mpWebhook)

// Resto requiere auth
router.use(requireAuth)

router.post('/', createOrder)
router.post('/checkout', checkoutLimit, startCheckout)
router.post('/confirm', checkoutLimit, confirmOrder)
router.get('/my', getMyOrders)
router.patch('/:id/transfer-proof', submitTransferProof)
router.get('/:id/tracking', getOrderTracking)
router.get('/:id', getOrderById)

export default router
