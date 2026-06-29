import crypto from 'crypto'
import type { Request, Response } from 'express'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { User } from '../models/User'
import type { AuthRequest } from '../types'
import { generateToken, hashToken, isExpired, TOKEN_TTL } from '../utils/tokens'
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email'
import { signTotpStepToken } from './twoFactorController'

interface JwtPayload {
  id: string
  role: 'user' | 'admin'
}

function signToken(id: string, role: JwtPayload['role']): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn']
  return jwt.sign({ id, role } satisfies JwtPayload, process.env.JWT_SECRET!, { expiresIn })
}

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 días en ms
const IS_PROD = process.env.NODE_ENV === 'production'

function setAuthCookies(res: Response, jwtToken: string): void {
  const csrfToken = crypto.randomBytes(32).toString('hex')

  // JWT en cookie httpOnly — JavaScript no puede leerla (protección XSS)
  res.cookie('auth-token', jwtToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })

  // CSRF token en cookie legible — el cliente la lee y la envía como header X-CSRF-Token
  res.cookie('csrf-token', csrfToken, {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

function clearAuthCookies(res: Response): void {
  res.clearCookie('auth-token', { httpOnly: true, secure: IS_PROD, sameSite: 'strict', path: '/' })
  res.clearCookie('csrf-token', { httpOnly: false, secure: IS_PROD, sameSite: 'strict', path: '/' })
}

function buildVerifyUrl(token: string): string {
  const base = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
  return `${base}/auth/verify/${token}`
}

function buildResetUrl(token: string): string {
  const base = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
  return `${base}/auth/reset/${token}`
}

// ═══════════════════════════════════════════════════════════
// POST /api/auth/register
// ═══════════════════════════════════════════════════════════
export async function registerUser(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as { name: string; email: string; password: string }

  const exists = await User.findOne({ email })
  if (exists) {
    res.status(409).json({ message: 'El email ya está registrado' })
    return
  }

  const { raw, hashed } = generateToken()

  const user = await User.create({
    name,
    email,
    password,
    emailVerified: false,
    verificationToken: hashed,
    verificationExpires: new Date(Date.now() + TOKEN_TTL.VERIFICATION),
  })

  // Enviar mail (no bloquea la respuesta — si falla, logueamos)
  try {
    await sendVerificationEmail(user.email, user.name, buildVerifyUrl(raw))
  } catch {
    // El user puede pedir reenvío después con /resend-verification
  }

  res.status(201).json({
    message: 'Cuenta creada. Revisá tu email para verificarla.',
    user: { _id: user._id, name: user.name, email: user.email, emailVerified: false },
  })
}

// ═══════════════════════════════════════════════════════════
// POST /api/auth/login
// ═══════════════════════════════════════════════════════════
export async function loginUser(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string }

  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    res.status(401).json({ message: 'Credenciales inválidas' })
    return
  }

  const valid = await user.comparePassword(password)
  if (!valid) {
    res.status(401).json({ message: 'Credenciales inválidas' })
    return
  }

  if (!user.emailVerified) {
    res.status(403).json({
      message: 'Tenés que verificar tu email antes de iniciar sesión.',
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email,
    })
    return
  }

  // Si es admin con 2FA habilitado → paso intermedio
  if (user.role === 'admin' && user.twoFactorEnabled) {
    const totpToken = signTotpStepToken(user._id.toString())
    res.json({
      requiresTwoFactor: true,
      totpToken, // token temporal (5 min) — solo sirve para /2fa/verify
    })
    return
  }

  const token = signToken(user._id.toString(), user.role)
  setAuthCookies(res, token)
  res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
  })
}

// ═══════════════════════════════════════════════════════════
// GET /api/auth/verify/:token
// ═══════════════════════════════════════════════════════════
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  const hashed = hashToken(token)

  const user = await User.findOne({ verificationToken: hashed }).select(
    '+verificationToken +verificationExpires'
  )

  if (!user) {
    res.status(400).json({ message: 'Link de verificación inválido' })
    return
  }

  if (isExpired(user.verificationExpires)) {
    res.status(400).json({
      message: 'El link expiró. Pedí uno nuevo.',
      code: 'TOKEN_EXPIRED',
    })
    return
  }

  user.emailVerified = true
  user.verificationToken = undefined
  user.verificationExpires = undefined
  await user.save()

  const jwtToken = signToken(user._id.toString(), user.role)
  setAuthCookies(res, jwtToken)

  res.json({
    message: 'Email verificado. Ya podés operar normalmente.',
    token: jwtToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: true,
    },
  })
}

// ═══════════════════════════════════════════════════════════
// POST /api/auth/resend-verification
// ═══════════════════════════════════════════════════════════
export async function resendVerification(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string }

  const user = await User.findOne({ email })
  // Respuesta neutra para no leakear si el email existe
  if (!user || user.emailVerified) {
    res.json({ message: 'Si el email existe y no está verificado, te llegará uno nuevo.' })
    return
  }

  const { raw, hashed } = generateToken()
  user.verificationToken = hashed
  user.verificationExpires = new Date(Date.now() + TOKEN_TTL.VERIFICATION)
  await user.save()

  try {
    await sendVerificationEmail(user.email, user.name, buildVerifyUrl(raw))
  } catch {
    // log only
  }

  res.json({ message: 'Si el email existe y no está verificado, te llegará uno nuevo.' })
}

// ═══════════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// ═══════════════════════════════════════════════════════════
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string }

  const user = await User.findOne({ email })
  // Respuesta neutra: no leakear si el email existe en la DB
  if (!user) {
    res.json({ message: 'Si el email está registrado, te llegará un link de recuperación.' })
    return
  }

  const { raw, hashed } = generateToken()
  user.passwordResetToken = hashed
  user.passwordResetExpires = new Date(Date.now() + TOKEN_TTL.PASSWORD_RESET)
  await user.save()

  try {
    await sendPasswordResetEmail(user.email, user.name, buildResetUrl(raw))
  } catch {
    // log only
  }

  res.json({ message: 'Si el email está registrado, te llegará un link de recuperación.' })
}

// ═══════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// ═══════════════════════════════════════════════════════════
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body as { token: string; newPassword: string }

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' })
    return
  }

  const hashed = hashToken(token)
  const user = await User.findOne({ passwordResetToken: hashed }).select(
    '+passwordResetToken +passwordResetExpires'
  )

  if (!user) {
    res.status(400).json({ message: 'Link de recuperación inválido' })
    return
  }

  if (isExpired(user.passwordResetExpires)) {
    res.status(400).json({
      message: 'El link expiró. Pedí uno nuevo.',
      code: 'TOKEN_EXPIRED',
    })
    return
  }

  user.password = newPassword // el pre('save') hashea
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  const jwtToken = signToken(user._id.toString(), user.role)
  setAuthCookies(res, jwtToken)

  res.json({
    message: 'Contraseña actualizada.',
    token: jwtToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  })
}

// ═══════════════════════════════════════════════════════════
// POST /api/auth/logout
// ═══════════════════════════════════════════════════════════
export async function logoutUser(_req: Request, res: Response): Promise<void> {
  clearAuthCookies(res)
  res.json({ message: 'Sesión cerrada.' })
}

// ═══════════════════════════════════════════════════════════
// GET /api/auth/me
// ═══════════════════════════════════════════════════════════
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user?.id)
  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' })
    return
  }
  res.json(user)
}
