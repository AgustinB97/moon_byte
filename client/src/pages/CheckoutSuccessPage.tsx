import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, Loader2, Package, ArrowRight } from 'lucide-react'
import { confirmOrder } from '@/services/orders'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/utils'
import type { Order } from '@/types'

type Status = 'confirming' | 'success' | 'error'

export function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<Status>('confirming')
  const [order, setOrder] = useState<Order | null>(null)
  const clearCart = useCartStore((s) => s.clearCart)
  const confirmedRef = useRef(false)

  useEffect(() => {
    if (confirmedRef.current) return
    confirmedRef.current = true

    // MP redirige con: payment_id, status, external_reference (= orderId)
    // En modo mock, los mismos params los pone nuestro initPoint
    const paymentId = searchParams.get('payment_id')
    const externalReference = searchParams.get('external_reference')
    const orderId = externalReference ?? sessionStorage.getItem('pendingOrderId')

    if (!orderId || !paymentId) {
      setStatus('error')
      return
    }

    // Backend verifica con MP API que el payment realmente está aprobado
    // y que corresponde a este orderId — el cliente nunca dictamina el status.
    confirmOrder(orderId, paymentId)
      .then((o) => {
        setOrder(o)
        setStatus('success')
        clearCart()
        sessionStorage.removeItem('pendingOrderId')
        sessionStorage.removeItem('isMockPayment')
      })
      .catch(() => setStatus('error'))
  }, [searchParams, clearCart])

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 pt-16">
      <div className="fixed inset-0 grid-line opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-md text-center">
        <div className="bg-surface-mid border border-steel/20 p-8">
          {status === 'confirming' && (
            <>
              <Loader2 size={32} className="text-gold animate-spin mx-auto mb-4" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
                [ Confirmando ]
              </p>
              <h1 className="font-display text-3xl uppercase tracking-tightest text-ash">
                Procesando pago...
              </h1>
            </>
          )}

          {status === 'success' && order && (
            <>
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-2">
                [ Pedido confirmado ]
              </p>
              <h1 className="font-display text-3xl uppercase tracking-tightest text-ash mb-2">
                ¡Gracias!
              </h1>
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel mb-6">
                Tu pedido está siendo preparado
              </p>

              <div className="border border-steel/15 bg-surface-dark p-4 mb-6 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-steel/60">Pedido</span>
                  <span className="font-mono text-[10px] text-gold uppercase tracking-widest">
                    #{order._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-steel/60">Total</span>
                  <span className="font-mono text-lg text-gold">{formatCurrency(order.total)}</span>
                </div>
              </div>

              <p className="font-mono text-[10px] uppercase tracking-widest text-steel/50 mb-6 leading-relaxed">
                Te mandamos un email con los detalles. Podés ver el estado en cualquier momento desde Mis Pedidos.
              </p>

              <div className="flex flex-col gap-2">
                <Link to={`/pedidos/${order._id}`}>
                  <Button size="lg" className="w-full group">
                    Ver pedido
                    <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/productos">
                  <Button variant="outline" size="md" className="w-full">
                    Seguir comprando
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <Package size={32} className="text-steel mx-auto mb-4" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
                [ Error ]
              </p>
              <h1 className="font-display text-3xl uppercase tracking-tightest text-ash mb-2">
                No pudimos<br />confirmar
              </h1>
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel mb-6">
                El pago puede haberse procesado correctamente.<br />
                Revisá Mis Pedidos en unos minutos.
              </p>
              <Link to="/pedidos">
                <Button size="md" className="w-full">Ver Mis Pedidos</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
