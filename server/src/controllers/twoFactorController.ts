import crypto from 'crypto'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import jwt, { type SignOptions } from 'jsonwebtoken'
import type { Response } from 'express'
import { User } from '../models/User'
import type { AuthRequest } from '../types'

const APP_NAME = 'MoonByte'
const BACKUP_CODE_COUNT = 8
const TOTP_STEP_EXPIRES_MIN = 5

// ── Helpers ──────────────────────────────────────────────────

function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  )
}

/** Token temporal (5 min) para el paso de verificación TOTP en el login */
function signTotpStepToken(userId: string): string {
  const expiresIn = `${TOTP_STEP_EXPIRES_MIN}m` as SignOptions['expiresIn']
  return jwt.sign({ id: userId, step: 'totp' }, process.env.JWT_SECRET!, { expiresIn })
}

function setAuthCookies(res: Response, jwtToken: string): void {
  const csrfToken = crypto.randomBytes(32).toString('hex')
  const isProd = process.env.NODE_ENV === 'production'
  const maxAge = 7 * 24 * 60 * 60 * 1000

  res.cookie('auth-token', jwtToken, { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge, path: '/' })
  res.cookie('csrf-token', csrfToken, { httpOnly: false, secure: isProd, sameSite: 'strict', maxAge, path: '/' })
}

// ── Endpoints ────────────────────────────────────────────────

/**
 * GET /api/auth/2fa/setup
 * Genera el secreto TOTP y devuelve la URL del QR.
 * Solo disponible para admins con 2FA aún no habilitado.
 */
export async function setup2FA(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id)
  if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return }
  if (user.role !== 'admin') { res.status(403).json({ message: '2FA solo disponible para admins' }); return }
  if (user.twoFactorEnabled) { res.status(409).json({ message: '2FA ya está habilitado' }); return }

  const secret = speakeasy.generateSecret({ name: `${APP_NAME} (${user.email})`, length: 20 })

  // Guardar secreto temporalmente (sin habilitar aún)
  await User.findByIdAndUpdate(user._id, { twoFactorSecret: secret.base32 })

  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url!)

  res.json({
    secret: secret.base32, // para ingresar manualmente si no pueden escanear
    qrCode: qrDataUrl,     // imagen base64 del QR
  })
}

/**
 * POST /api/auth/2fa/enable
 * Verifica el primer código TOTP y activa el 2FA.
 * Devuelve códigos de respaldo de un solo uso.
 */
export async function enable2FA(req: AuthRequest, res: Response): Promise<void> {
  const { code } = req.body as { code: string }
  if (!code) { res.status(400).json({ message: 'Código TOTP requerido' }); return }

  const user = await User.findById(req.user!.id).select('+twoFactorSecret')
  if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return }
  if (!user.twoFactorSecret) { res.status(400).json({ message: 'Primero generá el QR con /2fa/setup' }); return }
  if (user.twoFactorEnabled) { res.status(409).json({ message: '2FA ya está habilitado' }); return }

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  })

  if (!valid) { res.status(401).json({ message: 'Código incorrecto' }); return }

  const backupCodes = generateBackupCodes()
  await User.findByIdAndUpdate(user._id, {
    twoFactorEnabled: true,
    twoFactorBackupCodes: backupCodes,
  })

  res.json({
    message: '2FA activado correctamente.',
    backupCodes, // mostrárselos AL USUARIO — no se vuelven a ver
  })
}

/**
 * POST /api/auth/2fa/verify
 * Segundo paso del login: verifica el código TOTP y emite el JWT completo.
 */
export async function verify2FA(req: AuthRequest, res: Response): Promise<void> {
  const { code } = req.body as { code: string }
  if (!code) { res.status(400).json({ message: 'Código requerido' }); return }

  const user = await User.findById(req.user!.id).select('+twoFactorSecret +twoFactorBackupCodes')
  if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return }
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    res.status(400).json({ message: '2FA no está habilitado para este usuario' }); return
  }

  // Verificar código TOTP
  const validTotp = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  })

  // Verificar código de respaldo (si el TOTP falló)
  let usedBackup = false
  if (!validTotp) {
    const backupIndex = (user.twoFactorBackupCodes ?? []).indexOf(code.toUpperCase())
    if (backupIndex === -1) {
      res.status(401).json({ message: 'Código incorrecto' })
      return
    }
    // Consumir el código de respaldo
    const updatedCodes = [...(user.twoFactorBackupCodes ?? [])]
    updatedCodes.splice(backupIndex, 1)
    await User.findByIdAndUpdate(user._id, { twoFactorBackupCodes: updatedCodes })
    usedBackup = true
  }

  // Emitir JWT completo + cookies
  const fullToken = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'] }
  )
  setAuthCookies(res, fullToken)

  res.json({
    token: fullToken,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
    ...(usedBackup ? { warning: 'Usaste un código de respaldo. Te quedan ' + (user.twoFactorBackupCodes!.length - 1) } : {}),
  })
}

/**
 * POST /api/auth/2fa/disable
 * Deshabilita el 2FA. Requiere el código TOTP actual como confirmación.
 */
export async function disable2FA(req: AuthRequest, res: Response): Promise<void> {
  const { code } = req.body as { code: string }
  if (!code) { res.status(400).json({ message: 'Código TOTP requerido para deshabilitar' }); return }

  const user = await User.findById(req.user!.id).select('+twoFactorSecret')
  if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return }
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    res.status(400).json({ message: '2FA no está habilitado' }); return
  }

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  })

  if (!valid) { res.status(401).json({ message: 'Código incorrecto' }); return }

  await User.findByIdAndUpdate(user._id, {
    twoFactorEnabled: false,
    $unset: { twoFactorSecret: '', twoFactorBackupCodes: '' },
  })

  res.json({ message: '2FA deshabilitado.' })
}

export { signTotpStepToken }
