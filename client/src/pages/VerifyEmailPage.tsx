import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, Moon, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui'
import { AuthBackLink } from '@/components/layout/AuthBackLink'

type Status = 'verifying' | 'success' | 'error'

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { verifyEmail, error } = useAuthStore()
  const [status, setStatus] = useState<Status>('verifying')

  // Guard: React.StrictMode monta componentes 2 veces en dev.
  // Sin este ref, el verify se llamaría 2× — la 1ra borra el token,
  // la 2da falla con "Link inválido" porque ya no existe.
  // Usamos el token como key del ref para soportar navegar a otro token.
  const verifiedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    if (verifiedTokenRef.current === token) return
    verifiedTokenRef.current = token

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token, verifyEmail])

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4">
      <AuthBackLink />
      <div className="fixed inset-0 grid-line opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gold flex items-center justify-center">
            <Moon size={16} className="text-surface-dark" fill="currentColor" />
          </div>
        </Link>

        <div className="bg-surface-mid border border-steel/20 p-8">
          {status === 'verifying' && (
            <>
              <Loader2 size={32} className="text-gold animate-spin mx-auto mb-4" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
                [ Verificando ]
              </p>
              <h1 className="font-display text-3xl uppercase tracking-tightest text-ash">
                Procesando...
              </h1>
              <p className="font-mono text-[11px] text-steel/60 uppercase tracking-wide mt-4">
                Validando tu link de verificación
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 size={32} className="text-gold mx-auto mb-4" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-2">
                [ Verificado ]
              </p>
              <h1 className="font-display text-3xl uppercase tracking-tightest text-ash">
                Email
                <br />
                <span className="text-gold">Confirmado</span>
              </h1>
              <p className="font-mono text-[11px] text-steel uppercase tracking-wide mt-4 mb-6">
                Tu cuenta está activa. Ya iniciamos sesión por vos.
              </p>
              <Button size="lg" className="w-full group" onClick={() => navigate('/')}>
                Ir a la tienda
                <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={32} className="text-red-400 mx-auto mb-4" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-red-400 mb-2">
                [ Error ]
              </p>
              <h1 className="font-display text-3xl uppercase tracking-tightest text-ash">
                Link Inválido
              </h1>
              <p className="font-mono text-[11px] text-steel uppercase tracking-wide mt-4 mb-6">
                {error ?? 'El link es inválido o ya expiró. Pedí uno nuevo desde el login.'}
              </p>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="w-full">
                  Volver al login
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
