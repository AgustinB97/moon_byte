import { Router } from 'express'
import {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/adminController'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

// Todas las rutas admin requieren auth + rol admin
router.use(requireAuth, requireAdmin)

router.get('/stats', getDashboardStats)
router.get('/orders', getAllOrders)
router.patch('/orders/:id/status', updateOrderStatus)

export default router
