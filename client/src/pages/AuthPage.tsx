import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Mail, Lock, User, Moon, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button, Input } from '@/components/ui'
import { AuthBackLink } from '@/components/layout/AuthBackLink'

type Mode = 'login' | 'register'

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [resendOk, setResendOk] = useState(false)
  // Estado 2FA
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', ''])
  const totpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null))
  const {
    login, register, verifyTwoFactor,
    resendVerification, isLoading, error,
    pendingVerification, pendingTwoFactor, clearError,
  } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') ?? '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    try {
      if (mode === 'login') {
        await login(email, password)
        // Si no requiere 2FA → navegar. Si requiere → pendingTwoFactor se setea en el store.
        if (!useAuthStore.getState().pendingTwoFactor) {
          navigate(returnUrl)
        }
      } else {
        if (!name.trim()) { setLocalError('El nombre es requerido'); return }
        await register(name, email, password)
      }
    } catch {
      // Errors handled by store/local
    }
  }

  const handleTotpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...totpDigits]
    next[index] = digit
    setTotpDigits(next)
    if (digit && index < 5) totpRefs[index + 1].current?.focus()
  }

  const handleTotpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !totpDigits[index] && index > 0) {
      totpRefs[index - 1].current?.focus()
    }
  }

  const handleTotpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setTotpDigits(pasted.split(''))
      totpRefs[5].current?.focus()
    }
  }

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const code = totpDigits.join('')
    if (code.length !== 6) { setLocalError('Ingresá los 6 dígitos'); return }
    try {
      await verifyTwoFactor(code)
      navigate(returnUrl)
    } catch {
      setTotpDigits(['', '', '', '', '', ''])
      totpRefs[0].current?.focus()
    }
  }

  // Foco automático en el primer input de TOTP
  useEffect(() => {
    if (pendingTwoFactor) totpRefs[0].current?.focus()
  }, [pendingTwoFactor])

  const handleResend = async () => {
    if (!pendingVerification?.email) return
    setResendOk(false)
    try {
      await resendVerification(pendingVerification.email)
      setResendOk(true)
    } catch {
      // ignore
    }
  }

  // ── Estado: 2FA requerido ──────────────────────────────────
  if (pendingTwoFactor) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-4 pt-16">
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
              [ Verificación ]
            </p>
            <h1 className="font-display text-4xl uppercase tracking-tightest text-ash">
              Doble<br /><span className="text-gold">Factor</span>
            </h1>
          </div>

          <div className="bg-surface-mid border border-steel/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck size={20} className="text-gold flex-shrink-0" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel/70 leading-relaxed">
                Ingresá el código de 6 dígitos de tu app de autenticación
              </p>
            </div>

            <form onSubmit={handleVerifyTotp} className="flex flex-col gap-5">
              {/* Inputs individuales por dígito */}
              <div className="flex gap-2 justify-center" onPaste={handleTotpPaste}>
                {totpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={totpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleTotpChange(i, e.target.value)}
                    onKeyDown={(e) => handleTotpKeyDown(i, e)}
                    className="w-11 h-14 text-center bg-surface-dark border border-steel/30 text-ash font-mono text-xl focus:outline-none focus:border-gold/60 transition-colors"
                  />
                ))}
              </div>

              {(error || localError) && (
                <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest text-center">
                  {localError || error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" loading={isLoading}>
                Verificar
              </Button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  // ── Estado: post-register o login bloqueado por verificación ──
  if (pendingVerification) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-4 pt-16">
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
              [ Pendiente ]
            </p>
            <h1 className="font-display text-4xl uppercase tracking-tightest text-ash">
              Revisá
              <br />
              <span className="text-gold">Tu Email</span>
            </h1>
          </div>

          <div className="bg-surface-mid border border-steel/20 p-6">
            <div className="text-center">
              <MailCheck size={32} className="text-gold mx-auto mb-4" />

              <p className="font-mono text-[11px] uppercase tracking-wide text-ash mb-2">
                Te enviamos un email a
              </p>
              <p className="font-mono text-sm text-gold break-all mb-4">
                {pendingVerification.email}
              </p>
              <p className="font-mono text-[11px] text-steel uppercase tracking-wide leading-relaxed mb-6">
                Hacé click en el link del email para confirmar tu cuenta. El link expira en 24hs.
              </p>

              <div className="border-t border-steel/15 pt-5">
                <p className="font-mono text-[10px] text-steel/50 uppercase tracking-widest mb-3">
                  [ No te llegó? ]
                </p>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={handleResend}
                  loading={isLoading}
                  icon={<RefreshCw size={13} />}
                >
                  Reenviar email
                </Button>

                {resendOk && (
                  <p className="font-mono text-[10px] text-gold uppercase tracking-widest mt-3">
                    ✓ Si tu cuenta existe, el email fue reenviado
                  </p>
                )}
              </div>

              <button
                onClick={() => { useAuthStore.setState({ pendingVerification: null }); clearError() }}
                className="font-mono text-[10px] uppercase tracking-widest text-steel/50 hover:text-gold mt-6 transition-colors"
              >
                ← Volver al login
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 pt-16">
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
            [ {mode === 'login' ? 'Acceso' : 'Registro'} ]
          </p>
          <h1 className="font-display text-4xl uppercase tracking-tightest text-ash">
            {mode === 'login' ? 'Bienvenido' : 'Crear Cuenta'}
          </h1>
        </div>

        <div className="bg-surface-mid border border-steel/20 p-6 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

          <div className="flex border border-steel/20 mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setLocalError(''); clearError() }}
                className={`flex-1 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-all duration-200 ${
                  mode === m ? 'bg-gold text-surface-dark' : 'text-steel hover:text-ash'
                }`}
              >
                {m === 'login' ? 'Ingresar' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <Input
                label="Nombre completo"
                type="text"
                placeholder="Juan García"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User size={14} />}
                required
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={14} />}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={14} />}
              required
              minLength={6}
            />

            {mode === 'login' && (
              <Link
                to="/auth/forgot-password"
                className="font-mono text-[10px] uppercase tracking-widest text-steel/60 hover:text-gold self-end -mt-1 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            )}

            {(localError || error) && (
              <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest border border-red-500/20 px-3 py-2">
                [ Error ] {localError || error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" loading={isLoading}>
              {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </Button>

            {mode === 'register' && (
              <p className="font-mono text-[9px] uppercase tracking-widest text-steel/40 leading-relaxed text-center">
                Te vamos a enviar un email para verificar tu cuenta
              </p>
            )}
          </form>
        </div>

        <p className="text-center font-mono text-[9px] uppercase tracking-widest text-steel/30 mt-6">
          MoonByte — Sistema seguro · TLS 1.3
        </p>
      </div>
    </main>
  )
}
