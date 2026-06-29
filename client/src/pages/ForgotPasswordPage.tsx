import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Moon, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button, Input } from '@/components/ui'
import { AuthBackLink } from '@/components/layout/AuthBackLink'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { forgotPassword, isLoading, error } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await forgotPassword(email)
      setSent(true)
    } catch {
      // Error handled by store
    }
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
            [ Recuperación ]
          </p>
          <h1 className="font-display text-4xl uppercase tracking-tightest text-ash">
            {sent ? 'Revisá tu email' : 'Olvidaste tu contraseña'}
          </h1>
        </div>

        <div className="bg-surface-mid border border-steel/20 p-6">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 size={32} className="text-gold mx-auto mb-4" />
              <p className="font-mono text-[11px] uppercase tracking-wide text-ash mb-2">
                Si <strong className="text-gold">{email}</strong> está registrado,
              </p>
              <p className="font-mono text-[11px] uppercase tracking-wide text-steel mb-6">
                te llegará un link de recuperación que expira en 1 hora.
              </p>
              <Link to="/auth">
                <Button variant="outline" size="md" className="w-full">
                  <ArrowLeft size={14} className="mr-2" />
                  Volver al login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="font-mono text-[11px] text-steel uppercase tracking-wide leading-relaxed">
                Ingresá tu email y te enviamos un link para crear una nueva contraseña.
              </p>

              <Input
                label="Email"
                type="email"
                placeholder="usuario@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={14} />}
                required
              />

              {error && (
                <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest border border-red-500/20 px-3 py-2">
                  [ Error ] {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full mt-2" loading={isLoading}>
                Enviar link
              </Button>

              <Link
                to="/auth"
                className="font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold text-center mt-2 transition-colors"
              >
                ← Volver al login
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
