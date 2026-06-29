import api from './api'
import type { User } from '@/types'

interface AuthResponse {
  token?: string
  user: User
}

interface RegisterResponse {
  message: string
  user: Pick<User, '_id' | 'name' | 'email'> & { emailVerified: false }
}

interface MessageResponse {
  message: string
}

// Respuesta de login cuando el admin tiene 2FA activado
export interface TwoFactorRequired {
  requiresTwoFactor: true
  totpToken: string            // JWT temporal (corta duración) para la verificación
}

export type LoginResponse = { requiresTwoFactor?: false } & AuthResponse | TwoFactorRequired

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

/** Verificar el código TOTP de 6 dígitos. Usar el totpToken como Bearer. */
export async function verifyTwoFactor(code: string, totpToken: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(
    '/auth/2fa/verify',
    { code },
    { headers: { Authorization: `Bearer ${totpToken}` } }
  )
  return data
}

export async function register(name: string, email: string, password: string): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', { name, email, password })
  return data
}

export async function verifyEmail(token: string): Promise<AuthResponse> {
  const { data } = await api.get<AuthResponse>(`/auth/verify/${token}`)
  return data
}

export async function resendVerification(email: string): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/resend-verification', { email })
  return data
}

export async function forgotPassword(email: string): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/reset-password', { token, newPassword })
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

// ── 2FA setup (admin) ────────────────────────────────────────

export interface TwoFactorSetupData {
  qrCodeUrl: string        // URL para el QR (data URI o URL externa)
  secret: string           // Para mostrarlo como texto alternativo
}

export interface TwoFactorEnableResult {
  backupCodes: string[]    // 8 códigos de recuperación — mostrar UNA sola vez
}

export async function setup2fa(): Promise<TwoFactorSetupData> {
  const { data } = await api.get<TwoFactorSetupData>('/auth/2fa/setup')
  return data
}

export async function enable2fa(code: string): Promise<TwoFactorEnableResult> {
  const { data } = await api.post<TwoFactorEnableResult>('/auth/2fa/enable', { code })
  return data
}

export async function disable2fa(code: string): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/2fa/disable', { code })
  return data
}
