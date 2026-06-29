import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../controllers/authController'
import { requireAuth, requireTotpStep } from '../middleware/auth'
import { requireCsrf } from '../middleware/csrf'
import { setup2FA, enable2FA, verify2FA, disable2FA } from '../controllers/twoFactorController'
import { handleValidation } from '../middleware/validate'
import { authStrict, authNormal } from '../middleware/rateLimit'

const router = Router()

// Strict (5/15min): endpoints que un attacker quiere brutear
router.post(
  '/register',
  authStrict,
  body('name').trim().notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 80 }).withMessage('Nombre entre 2 y 80 caracteres'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
  handleValidation,
  registerUser
)

router.post(
  '/login',
  authStrict,
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  handleValidation,
  loginUser
)

router.post(
  '/forgot-password',
  authStrict,
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  handleValidation,
  forgotPassword
)

router.post(
  '/reset-password',
  authStrict,
  body('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Token inválido'),
  body('newPassword').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
  handleValidation,
  resetPassword
)

// Normal (20/5min): endpoints menos críticos
router.get(
  '/verify/:token',
  authNormal,
  param('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Token inválido'),
  handleValidation,
  verifyEmail
)

router.post(
  '/resend-verification',
  authNormal,
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  handleValidation,
  resendVerification
)

router.get('/me', requireAuth, getMe)
router.post('/logout', requireAuth, requireCsrf, logoutUser)

// ── 2FA (solo admins) ──
router.get('/2fa/setup', requireAuth, setup2FA)
router.post('/2fa/enable', requireAuth, enable2FA)
router.post('/2fa/verify', requireTotpStep, verify2FA) // usa totpToken, no el JWT completo
router.post('/2fa/disable', requireAuth, requireCsrf, disable2FA)

export default router
