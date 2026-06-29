import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Moon, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button, Input } from '@/components/ui'
import { AuthBackLink } from '@/components/layout/AuthBackLink'

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { resetPassword, isLoading, error } = useAuthStore()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [success, setSuccess] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!token) {
      setLocalError('Token inválido')
      return
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener mínimo 6 caracteres')
      return
    }
    if (password !== confirm) {
      setLocalError('Las contraseñas no coinciden')
      return
    }

    try {
      await resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    } catch {
      // Error handled by store
    }
  }

  if (success) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-4">
        <AuthBackLink />
        <div className="fixed inset-0 grid-line opacity-[0.03] pointer-events-none" />
        <div className="w-full max-w-md text-center">
          <div className="bg-surface-mid border border-steel/20 p-8">
            <CheckCircle2 size={32} className="text-gold mx-auto mb-4" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-2">
              [ Listo ]
            </p>
            <h1 className="font-display text-3xl uppercase tracking-tightest text-ash mb-4">
              Contraseña
              <br />
              <span className="text-gold">Actualizada</span>
            </h1>
            <p className="font-mono text-[11px] text-steel uppercase tracking-wide">
              Te llevamos a la tienda...
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4">
      <AuthBackLink />
      <div className="fixed inset-0 grid-line opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gold flex items-center justify-center">
              <Moon size={16} className="text-surface-dark" fill="currentColor" />
            </div>
          </Link>

          <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
            [ Reset ]
          </p>
          <h1 className="font-display text-4xl uppercase tracking-tightest text-ash">
            Nueva
            <br />
            <span className="text-gold">Contraseña</span>
          </h1>
        </div>

        <div className="bg-surface-mid border border-steel/20 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nueva contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={14} />}
              required
              minLength={6}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              icon={<Lock size={14} />}
              required
              minLength={6}
            />

            {(localError || error) && (
              <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest border border-red-500/20 px-3 py-2">
                [ Error ] {localError || error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full mt-2 group" loading={isLoading}>
              Actualizar contraseña
              <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
