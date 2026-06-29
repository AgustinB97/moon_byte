import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Moon, ArrowRight } from 'lucide-react'
import api from '@/services/api'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/utils'

type Status = 'idle' | 'approving' | 'success' | 'error'

interface ApprovalResponse {
  action: 'create' | 'update' | 'delete'
  message: string
  product?: { name: string; slug: string; price: number; priceCash: number }
}

const ACTION_TITLE: Record<ApprovalResponse['action'], string> = {
  create: 'Creación aprobada',
  update: 'Cambios aplicados',
  delete: 'Producto eliminado',
}

export function ApproveProductPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ApprovalResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleApprove = async () => {
    if (!token) return
    setStatus('approving')
    setErrorMsg('')
    try {
      const { data } = await api.get<ApprovalResponse>(`/products/approve/${token}`)
      setResult(data)
      setStatus('success')
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErrorMsg(msg ?? 'No pudimos procesar la aprobación')
      setStatus('error')
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 pt-16">
      <div className="fixed inset-0 grid-line opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gold flex items-center justify-center">
              <Moon size={16} className="text-surface-dark" fill="currentColor" />
            </div>
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
            [ Aprobación ]
          </p>
          <h1 className="font-display text-4xl uppercase tracking-tightest text-ash">
            {status === 'success'
              ? ACTION_TITLE[result!.action]
              : status === 'error'
              ? 'Error'
              : 'Confirmar cambio'}
          </h1>
        </div>

        <div className="bg-surface-mid border border-steel/20 p-6">
          {status === 'idle' && (
            <>
              <div className="border border-gold/30 bg-gold/5 px-4 py-3 mb-5 flex items-start gap-2">
                <AlertTriangle size={14} className="text-gold mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-gold leading-relaxed">
                    Estás por aprobar un cambio en el catálogo
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-steel/70 mt-1.5 leading-relaxed">
                    Verificá que el mail vino de tu cuenta MoonByte y que vos solicitaste este cambio.
                  </p>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={handleApprove}>
                Aprobar cambio
              </Button>
              <p className="text-center font-mono text-[9px] uppercase tracking-widest text-steel/40 mt-4">
                Si no fuiste vos, cerrá esta pestaña y reportá al admin
              </p>
            </>
          )}

          {status === 'approving' && (
            <div className="text-center py-8">
              <Loader2 size={32} className="text-gold animate-spin mx-auto mb-4" />
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel">
                Aplicando cambio...
              </p>
            </div>
          )}

          {status === 'success' && result && (
            <>
              <div className="text-center mb-5">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                  [ {result.action.toUpperCase()} ]
                </p>
              </div>

              <p className="font-mono text-[11px] uppercase tracking-wide text-ash text-center mb-4">
                {result.message}
              </p>

              {result.product && result.action !== 'delete' && (
                <div className="border border-steel/15 bg-surface-dark p-4 mb-5">
                  <p className="font-sans text-sm text-ash mb-2">{result.product.name}</p>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-steel/60">Precio MP</span>
                    <span className="text-gold">{formatCurrency(result.product.price)}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs mt-1">
                    <span className="text-steel/60">Efectivo</span>
                    <span className="text-emerald-400">{formatCurrency(result.product.priceCash)}</span>
                  </div>
                </div>
              )}

              <Button
                size="md"
                className="w-full group"
                onClick={() => navigate('/admin/productos')}
              >
                Ir al panel admin
                <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-center mb-5">
                <XCircle size={36} className="text-red-400 mx-auto mb-3" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-red-400">
                  [ Error ]
                </p>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-steel text-center mb-5 leading-relaxed">
                {errorMsg}
              </p>
              <Link to="/admin/productos">
                <Button variant="outline" size="md" className="w-full">
                  Ir al panel admin
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
