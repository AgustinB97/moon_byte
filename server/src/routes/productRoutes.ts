import { Router } from 'express'
import { param } from 'express-validator'
import {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  approveProductChange,
} from '../controllers/productController'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { handleValidation } from '../middleware/validate'

const router = Router()

// ── Públicas ──
router.get('/', getProducts)
router.get('/featured', getFeaturedProducts)

// Aprobación de cambios (token actúa como auth — sin requireAuth)
router.get(
  '/approve/:token',
  param('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Token inválido'),
  handleValidation,
  approveProductChange
)

// ── Admin ──
router.get('/admin/all', requireAuth, requireAdmin, getProductsForAdmin)
router.post('/', requireAuth, requireAdmin, createProduct)
router.put('/:id', requireAuth, requireAdmin, updateProduct)
router.delete('/:id', requireAuth, requireAdmin, deleteProduct)

// :slug debe ir al final para no chocar con /featured, /approve/:token, /admin/all
router.get('/:slug', getProductBySlug)

export default router
