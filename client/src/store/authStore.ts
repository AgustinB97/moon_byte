import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { User } from '@/types'
import {
  login as apiLogin,
  register as apiRegister,
  verifyEmail as apiVerifyEmail,
  resendVerification as apiResendVerification,
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
  logout as apiLogout,
  getMe,
  verifyTwoFactor as apiVerifyTwoFactor,
} from '@/services/auth'

interface LoginErrorDetail {
  code?: 'EMAIL_NOT_VERIFIED'
  email?: string
  message: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  pendingVerification: { email: string } | null
  pendingTwoFactor: { totpToken: string } | null   // esperando código TOTP

  login: (email: string, password: string) => Promise<void>
  verifyTwoFactor: (code: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<{ email: string }>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  clearError: () => void
}

function extractErrorDetail(err: unknown): LoginErrorDetail {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data as Partial<LoginErrorDetail>
    return {
      code: data.code,
      email: data.email,
      message: data.message ?? 'Error desconocido',
    }
  }
  return { message: 'Error de conexión' }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      pendingVerification: null,
      pendingTwoFactor: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await apiLogin(email, password)

          // El backend puede requerir 2FA
          if (res.requiresTwoFactor) {
            set({ isLoading: false, pendingTwoFactor: { totpToken: res.totpToken } })
            return
          }

          localStorage.removeItem('token')
          set({ user: res.user, isLoading: false, pendingVerification: null, pendingTwoFactor: null })
        } catch (err) {
          const detail = extractErrorDetail(err)
          set({
            error: detail.message,
            isLoading: false,
            pendingVerification:
              detail.code === 'EMAIL_NOT_VERIFIED' && detail.email
                ? { email: detail.email }
                : null,
          })
          throw err
        }
      },

      verifyTwoFactor: async (code) => {
        const { pendingTwoFactor } = useAuthStore.getState()
        if (!pendingTwoFactor) return
        set({ isLoading: true, error: null })
        try {
          const { user } = await apiVerifyTwoFactor(code, pendingTwoFactor.totpToken)
          localStorage.removeItem('token')
          set({ user, isLoading: false, pendingTwoFactor: null })
        } catch (err) {
          set({ error: extractErrorDetail(err).message, isLoading: false })
          throw err
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await apiRegister(name, email, password)
          set({ isLoading: false, pendingVerification: { email: res.user.email } })
          return { email: res.user.email }
        } catch (err) {
          set({ error: extractErrorDetail(err).message, isLoading: false })
          throw err
        }
      },

      verifyEmail: async (token) => {
        set({ isLoading: true, error: null })
        try {
          const { user } = await apiVerifyEmail(token)
          localStorage.removeItem('token')
          set({ user, isLoading: false, pendingVerification: null })
        } catch (err) {
          set({ error: extractErrorDetail(err).message, isLoading: false })
          throw err
        }
      },

      resendVerification: async (email) => {
        set({ isLoading: true, error: null })
        try {
          await apiResendVerification(email)
          set({ isLoading: false })
        } catch (err) {
          set({ error: extractErrorDetail(err).message, isLoading: false })
          throw err
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null })
        try {
          await apiForgotPassword(email)
          set({ isLoading: false })
        } catch (err) {
          set({ error: extractErrorDetail(err).message, isLoading: false })
          throw err
        }
      },

      resetPassword: async (token, newPassword) => {
        set({ isLoading: true, error: null })
        try {
          const { user } = await apiResetPassword(token, newPassword)
          localStorage.removeItem('token')
          set({ user, isLoading: false })
        } catch (err) {
          set({ error: extractErrorDetail(err).message, isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try {
          await apiLogout()
        } catch {
          // Si el request falla igual limpiamos el estado local
        }
        localStorage.removeItem('token')
        set({ user: null, pendingVerification: null, pendingTwoFactor: null })
      },

      loadUser: async () => {
        try {
          const user = await getMe()
          set({ user })
        } catch {
          localStorage.removeItem('token')
          set({ user: null })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'ph-auth',
      partialize: (state) => ({ user: state.user }),  // pendingTwoFactor no se persiste
    }
  )
)
