import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export function ConfirmCancelShipmentPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setState('error'); setMessage('Token inválido'); return }

    // Usamos fetch nativo en lugar del api autenticado:
    // la ruta es pública (el token actúa como auth), no necesita JWT.
    fetch(`/api/shipping/cancelar-confirmar/${token}`)
      .then(async (res) => {
        const json = await res.json() as { message?: string }
        if (!res.ok) throw new Error(json.message ?? `Error ${res.status}`)
        setState('success')
        setMessage(json.message ?? 'Envío cancelado correctamente')
      })
      .catch((err: unknown) => {
        setState('error')
        setMessage(err instanceof Error ? err.message : 'No se pudo cancelar el envío.')
      })
  }, [token])

  return (
    <main className="min-h-screen bg-surface-dark flex items-center justify-center px-4">
      <div className="border border-steel/20 bg-surface-mid p-10 max-w-md w-full text-center">
        <p className="font-mono text-[9px] uppercase tracking-widest text-steel mb-6">
          [ MoonByte Admin ]
        </p>

        {state === 'loading' && (
          <>
            <Loader2 size={32} className="animate-spin text-gold mx-auto mb-4" />
            <p className="font-mono text-[11px] uppercase tracking-widest text-steel">
              Procesando cancelación...
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
            <h1 className="font-display text-2xl uppercase tracking-tightest text-ash mb-2">
              Envío cancelado
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-400 mb-6">
              {message}
            </p>
            <Link
              to="/admin/pedidos"
              className="inline-block font-mono text-[10px] uppercase tracking-widest px-6 py-3 bg-gold text-surface-dark hover:opacity-90 transition-opacity"
            >
              Ir al panel de pedidos
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h1 className="font-display text-2xl uppercase tracking-tightest text-ash mb-2">
              No se pudo cancelar
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-widest text-red-400 mb-6">
              {message}
            </p>
            <Link
              to="/admin/pedidos"
              className="inline-block font-mono text-[10px] uppercase tracking-widest px-6 py-3 border border-steel/30 text-steel hover:border-gold hover:text-gold transition-colors"
            >
              Volver al panel
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
