import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Truck, RefreshCw, MapPinned, Clock } from 'lucide-react'
import { getOrderById, getOrderTracking } from '@/services/orders'
import type { TrackingResult } from '@/services/orders'
import { Button, StatusBadge } from '@/components/ui'
import { TransferProofForm } from '@/components/features/TransferProofForm'
import { BankInfoCard } from '@/components/features/BankInfoCard'
import { formatCurrency, cn } from '@/utils'
import type { Order } from '@/types'

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered'] as const

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tracking, setTracking] = useState<TrackingResult | null>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const proofRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    getOrderById(id)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [id])

  // Auto-scroll al form si vienen del mail con #comprobante
  useEffect(() => {
    if (order && location.hash === '#comprobante' && proofRef.current) {
      const timer = setTimeout(() => {
        proofRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [order, location.hash])

  if (isLoading) {
    return (
      <main className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="grid md:grid-cols-3 gap-8 animate-pulse">
          <div className="md:col-span-2 h-96 bg-surface-mid" />
          <div className="h-96 bg-surface-mid" />
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="max-w-5xl mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-steel/50">
          Pedido no encontrado
        </p>
        <Link to="/pedidos">
          <Button variant="outline" size="sm">Volver a mis pedidos</Button>
        </Link>
      </main>
    )
  }

  const date = new Date(order.createdAt).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const currentStep = STATUS_FLOW.indexOf(order.status as (typeof STATUS_FLOW)[number])
  const isCancelled = order.status === 'cancelled'
  const hasTracking = !!order.trackingNumber && ['processing', 'shipped', 'delivered'].includes(order.status)

  const fetchTracking = async () => {
    if (!id) return
    setTrackingLoading(true)
    setTrackingError(null)
    try {
      const result = await getOrderTracking(id)
      setTracking(result)
    } catch {
      setTrackingError('No se pudo obtener el seguimiento. Intentá de nuevo.')
    } finally {
      setTrackingLoading(false)
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 pt-24 pb-16">
      {/* Back */}
      <Link
        to="/pedidos"
        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-colors mb-6"
      >
        <ArrowLeft size={12} />
        Mis Pedidos
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
            [ Pedido ]
          </p>
          <h1 className="font-display text-[clamp(2rem,6vw,4rem)] uppercase tracking-tightest text-ash">
            #{order._id.slice(-6).toUpperCase()}
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel/60 mt-1">
            {date}
          </p>
        </div>
        <StatusBadge status={order.status} className="text-xs px-3 py-1.5" />
      </div>

      {/* Tracker (solo si no está cancelado) */}
      {!isCancelled && (
        <div className="mb-8 border border-steel/20 bg-surface-mid p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-4">
            [ Estado del envío ]
          </p>
          <div className="flex items-center justify-between gap-2 relative">
            <div className="absolute top-3 left-0 right-0 h-px bg-steel/15" />
            <div
              className="absolute top-3 left-0 h-px bg-gold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ width: `${(currentStep / (STATUS_FLOW.length - 1)) * 100}%` }}
            />

            {STATUS_FLOW.map((step, i) => {
              const reached = i <= currentStep
              const labels: Record<string, string> = {
                pending: 'Recibido',
                processing: 'Confirmado',
                shipped: 'Enviado',
                delivered: 'Entregado',
              }
              return (
                <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                  <div
                    className={cn(
                      'w-6 h-6 flex items-center justify-center border',
                      reached
                        ? 'bg-gold border-gold text-surface-dark'
                        : 'bg-surface-mid border-steel/30 text-steel/40'
                    )}
                  >
                    <span className="font-mono text-[10px]">{i + 1}</span>
                  </div>
                  <span
                    className={cn(
                      'font-mono text-[9px] uppercase tracking-widest',
                      reached ? 'text-gold' : 'text-steel/40'
                    )}
                  >
                    {labels[step]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Seguimiento Andreani */}
      {hasTracking && (
        <div className="mb-8 border border-steel/20 bg-surface-mid p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel flex items-center gap-2">
              <Truck size={12} />
              [ Seguimiento Andreani · {order.trackingNumber} ]
            </p>
            <button
              onClick={fetchTracking}
              disabled={trackingLoading}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-colors disabled:opacity-40"
            >
              <RefreshCw size={11} className={trackingLoading ? 'animate-spin' : ''} />
              {tracking ? 'Actualizar' : 'Consultar'}
            </button>
          </div>

          {trackingError && (
            <p className="font-mono text-[10px] text-red-400">{trackingError}</p>
          )}

          {!tracking && !trackingError && !trackingLoading && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel/40">
              Hacé click en "Consultar" para ver el estado del envío en tiempo real.
            </p>
          )}

          {trackingLoading && (
            <div className="flex items-center gap-2 py-2">
              <RefreshCw size={12} className="animate-spin text-gold" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-steel/60">Consultando Andreani...</span>
            </div>
          )}

          {tracking && (
            <div className="flex flex-col gap-3">
              {/* Status actual */}
              <div className="flex items-center gap-3 p-3 bg-surface-dark border border-steel/15">
                <div className="w-2 h-2 bg-gold animate-pulse flex-shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-steel/50">Estado actual</p>
                  <p className="font-mono text-sm text-gold uppercase tracking-wide">{tracking.status}</p>
                </div>
              </div>

              {/* Timeline de eventos */}
              {tracking.eventos.length > 0 && (
                <div className="flex flex-col gap-px bg-steel/10 mt-1">
                  {tracking.eventos.map((evento, i) => (
                    <div key={i} className="bg-surface-dark p-3 flex gap-3">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                        <div className={cn(
                          'w-1.5 h-1.5',
                          i === 0 ? 'bg-gold' : 'bg-steel/30'
                        )} />
                        {i < tracking.eventos.length - 1 && (
                          <div className="w-px flex-1 bg-steel/15 min-h-[16px]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-[13px] text-ash leading-snug">{evento.description}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {evento.location && (
                            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-steel/50">
                              <MapPinned size={9} />
                              {evento.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-steel/40">
                            <Clock size={9} />
                            {new Date(evento.timestamp).toLocaleString('es-AR', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tracking.eventos.length === 0 && (
                <p className="font-mono text-[10px] uppercase tracking-widest text-steel/40 py-2">
                  Todavía no hay eventos registrados para este envío.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Items */}
        <div className="md:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-3">
            [ Productos · {order.items.length} ]
          </p>
          <div className="flex flex-col gap-px bg-steel/10">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 bg-surface-mid p-4">
                <div className="w-16 h-16 bg-surface-dark overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={20} className="text-steel/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-ash leading-snug">{item.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-steel/50 mt-1">
                    Cantidad: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-base text-gold">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  <p className="font-mono text-[9px] text-steel/40 mt-0.5">
                    {formatCurrency(item.price)} c/u
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Totales */}
          <div className="border border-steel/20 bg-surface-mid p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-3">
              [ Resumen ]
            </p>
            <div className="flex justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wide text-steel">Subtotal</span>
              <span className="font-mono text-sm text-ash">{formatCurrency(order.total)}</span>
            </div>
            <div className="h-px bg-steel/15 my-3" />
            <div className="flex justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Total</span>
              <span className="font-mono text-xl text-gold">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Shipping */}
          {order.shippingAddress?.street && (
            <div className="border border-steel/20 bg-surface-mid p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-3 flex items-center gap-2">
                <MapPin size={12} />
                Envío
              </p>
              <p className="font-mono text-[11px] text-ash leading-relaxed">
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                CP {order.shippingAddress.postalCode}<br />
                <span className="text-steel/60">{order.shippingAddress.country}</span>
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Datos de transferencia + form de comprobante
          Solo visibles si: paymentMethod=transferencia AND status=pending.
          Al pasar a "Confirmado" (processing) o cualquier estado posterior,
          ambos se ocultan automáticamente. */}
      {order.paymentMethod === 'transferencia' && order.status === 'pending' && (
        <div ref={proofRef} id="comprobante" className="mt-8 scroll-mt-24 flex flex-col gap-6">
          {/* Bank info — variant compact (sin header grande, va en la misma página) */}
          {order.bankInfo && (
            <BankInfoCard
              bankInfo={order.bankInfo}
              amount={order.total}
              orderId={order._id}
              variant="compact"
            />
          )}

          {/* Form para enviar comprobante (o summary si ya lo envió) */}
          <TransferProofForm
            orderId={order._id}
            expectedAmount={order.total}
            existingProof={order.transferProof}
            onSubmitted={setOrder}
          />
        </div>
      )}
    </main>
  )
}
