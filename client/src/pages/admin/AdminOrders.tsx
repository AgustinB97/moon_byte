import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Package, ChevronDown, Eye, Receipt, AlertCircle, CheckCircle2, X, Building2, Truck, ExternalLink, XCircle, RefreshCw } from 'lucide-react'
import { getAllOrders, updateOrderStatus, cancelShipment } from '@/services/admin'
import { StatusBadge, Badge } from '@/components/ui'
import { formatCurrency, cn } from '@/utils'
import type { Order, OrderStatus } from '@/types'

const POLL_INTERVAL = 30_000 // 30 segundos

const ALL_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_DOT: Record<OrderStatus, string> = {
  pending: 'bg-gold animate-pulse',
  processing: 'bg-emerald-400',
  shipped: 'bg-blue-400 animate-pulse',
  delivered: 'bg-emerald-400',
  cancelled: 'bg-red-400',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  processing: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const knownIdsRef = useRef<Set<string>>(new Set())
  const isFirstLoad = useRef(true)
  const generationRef = useRef(0) // para descartar respuestas stale (race condition)

  const filterStatus = (searchParams.get('status') as OrderStatus | null) ?? undefined

  const maxTotalChars = useMemo(
    () => (orders.length ? Math.max(...orders.map((o) => formatCurrency(o.total).length)) : 0),
    [orders]
  )

  const load = useCallback(async (silent = false) => {
    const gen = ++generationRef.current // snapshot de esta llamada
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)
    try {
      const res = await getAllOrders({ status: filterStatus, limit: 50 })

      // Si llegó una respuesta de una generación anterior (filtro cambió mientras viajaba), descartarla
      if (gen !== generationRef.current) return

      const incoming = res.data

      if (!isFirstLoad.current) {
        const nuevos = incoming.filter((o) => !knownIdsRef.current.has(o._id))
        if (nuevos.length > 0) setNewOrdersCount((n) => n + nuevos.length)
      }

      knownIdsRef.current = new Set(incoming.map((o) => o._id))
      isFirstLoad.current = false
      setOrders(incoming)
      setLastUpdated(new Date())
    } catch (e) {
      if (gen !== generationRef.current) return
      // 401 en poll silencioso = sesión expirada; el interceptor de api ya redirige
      const status = (e as { response?: { status?: number } })?.response?.status
      if (!silent) setOrders([])
      if (status === 401) return // el interceptor maneja el redirect
    } finally {
      if (gen === generationRef.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [filterStatus])

  // Carga inicial y reset al cambiar filtro
  useEffect(() => {
    isFirstLoad.current = true
    knownIdsRef.current = new Set()
    setNewOrdersCount(0)
    void load()
  }, [load])

  // Polling cada 30s
  useEffect(() => {
    const id = setInterval(() => void load(true), POLL_INTERVAL)
    return () => clearInterval(id)
  }, [load])

  // Refetch al recuperar foco de la pestaña
  useEffect(() => {
    const onFocus = () => void load(true)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId)
    try {
      const updated = await updateOrderStatus(orderId, status)
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: updated.status } : o)))
    } catch {
      alert('Error al actualizar el status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
            [ Admin / Pedidos ]
          </p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] uppercase tracking-tightest text-ash">
            Pedidos
          </h1>
        </div>

        <div className="flex items-center gap-3 mt-2">
          {/* Indicador de nuevos pedidos */}
          {newOrdersCount > 0 && (
            <button
              onClick={() => { setNewOrdersCount(0); void load(true) }}
              className="flex items-center gap-2 border border-gold/40 bg-gold/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-gold hover:bg-gold/20 transition-colors animate-pulse"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {newOrdersCount} nuevo{newOrdersCount > 1 ? 's' : ''}
            </button>
          )}

          {/* Último update + botón refresh */}
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="font-mono text-[9px] uppercase tracking-widest text-steel/40">
                <LiveTimestamp date={lastUpdated} />
              </span>
            )}
            <button
              onClick={() => void load(true)}
              disabled={isRefreshing}
              title="Actualizar ahora"
              className="p-1.5 text-steel hover:text-gold transition-colors disabled:opacity-40"
            >
              <RefreshCw size={13} className={cn(isRefreshing && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setSearchParams({}) }}
          className={cn(
            'font-mono text-[10px] uppercase tracking-widest px-3 py-2 border transition-colors',
            !filterStatus
              ? 'bg-gold text-surface-dark border-gold'
              : 'text-steel border-steel/30 hover:border-gold/40 hover:text-ash'
          )}
        >
          Todos
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setSearchParams({ status: s })}
            className={cn(
              'font-mono text-[10px] uppercase tracking-widest px-3 py-2 border transition-colors',
              filterStatus === s
                ? 'bg-gold text-surface-dark border-gold'
                : 'text-steel border-steel/30 hover:border-gold/40 hover:text-ash'
            )}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="grid gap-px bg-steel/10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-mid animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-steel/15 bg-surface-mid p-12 text-center">
          <Package size={32} className="text-steel/30 mx-auto mb-3" />
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel/50">
            No hay pedidos {filterStatus && `en estado "${STATUS_LABEL[filterStatus]}"`}
          </p>
        </div>
      ) : (
        <div className="grid gap-px bg-steel/10">
          {orders.map((order) => {
            // Backend popula user con { name, email } cuando es admin
            const userInfo = (typeof order.user === 'object' && order.user !== null
              ? order.user
              : null) as { name?: string; email?: string } | null

            const isTransfer = order.paymentMethod === 'transferencia'
            const hasProof = !!order.transferProof?.submittedAt

            return (
              <div key={order._id} className="bg-surface-mid p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-gold">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="font-mono text-[9px] text-steel/30">///</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-steel/50">
                      {new Date(order.createdAt).toLocaleString('es-AR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {isTransfer && (
                      <Badge variant={hasProof ? 'success' : 'gold'} className="gap-1">
                        {hasProof ? (
                          <><CheckCircle2 size={9} />Comprobante recibido</>
                        ) : (
                          <><AlertCircle size={9} />Esperando comprobante</>
                        )}
                      </Badge>
                    )}
                    {order.paymentMethod === 'mercadopago' && (
                      <Badge variant="steel">MP</Badge>
                    )}
                  </div>

                  {userInfo && (
                    <p className="font-mono text-[11px] text-ash/80">
                      {userInfo.name} <span className="text-steel/40">·</span> {userInfo.email}
                    </p>
                  )}

                  <p className="font-mono text-[10px] uppercase tracking-widest text-steel/50 mt-1 truncate">
                    {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'} ·{' '}
                    {order.items.map((i) => i.name).slice(0, 2).join(', ')}
                  </p>
                </div>

                {/* Acciones: fila en mobile, siblings en desktop via contents */}
                <div className="flex items-center gap-3 md:contents">
                  {/* Status selector */}
                  <div className="relative flex-shrink-0">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value as OrderStatus)}
                      disabled={updatingId === order._id}
                      className="appearance-none bg-surface-dark border border-steel/30 text-ash font-mono text-[10px] uppercase tracking-widest pl-5 pr-8 py-2 focus:outline-none focus:border-gold/60 cursor-pointer hover:border-gold/40 transition-colors disabled:opacity-50"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <span className={cn('absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 pointer-events-none', STATUS_DOT[order.status])} />
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-steel pointer-events-none" />
                  </div>

                  <button
                    onClick={() => setDetailOrder(order)}
                    title={
                      hasProof && order.status === 'pending'
                        ? 'Comprobante recibido — revisar'
                        : 'Ver detalle del pedido'
                    }
                    className={cn(
                      'p-2 transition-colors flex-shrink-0',
                      hasProof && order.status === 'pending'
                        ? 'text-gold hover:text-gold-light animate-pulse'
                        : 'text-steel hover:text-gold'
                    )}
                    aria-label="Ver detalle"
                  >
                    <Eye size={14} />
                  </button>

                  <span
                    className="font-mono text-lg text-gold whitespace-nowrap ml-auto md:ml-0 flex-shrink-0 text-right"
                    style={maxTotalChars ? { minWidth: `${maxTotalChars}ch` } : undefined}
                  >
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onOrderUpdate={(updated) => {
            setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)))
            setDetailOrder(updated)
          }}
        />
      )}
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Modal con detalle completo de la orden — incluye transferProof
// ───────────────────────────────────────────────────────────
function OrderDetailModal({
  order, onClose, onOrderUpdate,
}: {
  order: Order
  onClose: () => void
  onOrderUpdate: (updated: Order) => void
}) {
  const isTransfer = order.paymentMethod === 'transferencia'
  const hasProof = !!order.transferProof?.submittedAt
  const orderShort = `#${order._id.slice(-6).toUpperCase()}`
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const [cancelRequested, setCancelRequested] = useState(false)

  const handleCancelShipment = async () => {
    if (!confirm('¿Solicitar la cancelación del envío? Se enviará un email de confirmación a APPROVAL_EMAIL.')) return
    setCancelling(true)
    setCancelError(null)
    try {
      await cancelShipment(order._id)
      setCancelRequested(true)
    } catch {
      setCancelError('No se pudo enviar la solicitud. Intentá de nuevo.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-surface-mid border border-steel/20 w-full max-w-2xl my-8 animate-reveal">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-steel/15">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel">
              [ Detalle ]
            </p>
            <h2 className="font-display text-2xl uppercase tracking-tightest text-ash">
              Pedido {orderShort}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-steel hover:text-ash transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 grid gap-5">
          {/* Estado + método */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={order.status} />
            <Badge variant={isTransfer ? 'gold' : 'steel'}>
              {isTransfer ? '🏦 Transferencia' : '💳 Mercado Pago'}
            </Badge>
            <span className="ml-auto font-mono text-xl text-gold">
              {formatCurrency(order.total)}
            </span>
          </div>

          {/* Items */}
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
              [ Productos · {order.items.length} ]
            </p>
            <div className="grid gap-px bg-steel/10">
              {order.items.map((item, i) => (
                <div key={i} className="bg-surface-dark p-3 flex items-center gap-3">
                  <span className="font-mono text-[10px] text-steel w-8">×{item.quantity}</span>
                  <span className="flex-1 font-sans text-sm text-ash truncate">{item.name}</span>
                  <span className="font-mono text-sm text-gold whitespace-nowrap">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Comprobante (solo si transferencia) */}
          {isTransfer && (
            <section className={cn(
              'border p-4',
              hasProof
                ? 'border-emerald-400/30 bg-emerald-400/5'
                : 'border-gold/30 bg-gold/5'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Receipt size={13} className={hasProof ? 'text-emerald-400' : 'text-gold'} />
                <p className={cn(
                  'font-mono text-[10px] uppercase tracking-widest',
                  hasProof ? 'text-emerald-400' : 'text-gold'
                )}>
                  {hasProof ? '[ Comprobante recibido ]' : '[ Esperando comprobante del cliente ]'}
                </p>
              </div>

              {hasProof && order.transferProof ? (
                <TransferProofDetail proof={order.transferProof} />
              ) : (
                <p className="font-mono text-[10px] uppercase tracking-wide text-steel/70">
                  El cliente todavía no envió los datos de la transferencia.
                </p>
              )}
            </section>
          )}

          {/* Billing */}
          {order.billingInfo && (
            <section>
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
                [ Datos de facturación ]
              </p>
              <div className="border border-steel/15 bg-surface-dark p-3 space-y-1.5 font-mono text-[11px]">
                <p><span className="text-steel/60">Tipo:</span> <span className="text-gold">Factura {order.billingInfo.invoiceType}</span></p>
                <p><span className="text-steel/60">Razón social:</span> <span className="text-ash">{order.billingInfo.name}</span></p>
                <p><span className="text-steel/60">CUIT/DNI:</span> <span className="text-ash">{order.billingInfo.taxId}</span></p>
                <p><span className="text-steel/60">Categoría:</span> <span className="text-ash">{order.billingInfo.taxCategory}</span></p>
                <p className="pt-2 border-t border-steel/10 mt-2">
                  <span className="text-steel/60">Domicilio:</span><br />
                  <span className="text-ash">
                    {order.billingInfo.billingAddress.street},{' '}
                    {order.billingInfo.billingAddress.city},{' '}
                    {order.billingInfo.billingAddress.state} (CP {order.billingInfo.billingAddress.postalCode})
                  </span>
                </p>
              </div>
            </section>
          )}

          {/* Shipping */}
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2 flex items-center gap-1.5">
              <Building2 size={12} />
              Dirección de envío
            </p>
            <div className="border border-steel/15 bg-surface-dark p-3 font-mono text-[11px] space-y-1">
              <p className="text-ash">
                {order.shippingAddress.street}
                {order.shippingExtra?.apartment && `, ${order.shippingExtra.apartment}`}
              </p>
              <p className="text-ash">
                {order.shippingAddress.city}, {order.shippingAddress.state} — CP {order.shippingAddress.postalCode}
              </p>
              {order.shippingExtra?.phone && (
                <p><span className="text-steel/60">Tel:</span> <span className="text-ash">{order.shippingExtra.phone}</span></p>
              )}
              {order.shippingExtra?.deliveryNotes && (
                <p className="pt-2 border-t border-steel/10 mt-2">
                  <span className="text-steel/60">Notas:</span> <span className="text-ash/80">{order.shippingExtra.deliveryNotes}</span>
                </p>
              )}
            </div>
          </section>

          {/* Envío Envia.com — visible en cualquier estado con datos de envío */}
          {(order.shipmentId || order.trackingNumber) && (
            <section>
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2 flex items-center gap-1.5">
                <Truck size={12} />
                Envia.com
              </p>

              {order.shipmentId ? (
                <div className="border border-emerald-400/30 bg-emerald-400/5 p-3 flex flex-col gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                      Etiqueta generada
                    </span>
                    <span className="font-mono text-[10px] text-steel/50">
                      Envío #{order.shipmentId}
                    </span>
                  </div>
                  {order.trackingNumber && (
                    <p className="font-mono text-[11px] text-ash">
                      Tracking: <span className="text-gold">{order.trackingNumber}</span>
                    </p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {order.labelUrl && (
                      <a
                        href={order.labelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest border border-steel/30 hover:border-gold hover:text-gold text-steel px-3 py-2 transition-colors"
                      >
                        <ExternalLink size={10} />
                        Ver etiqueta
                      </a>
                    )}
                    {/* Cancelar solo disponible en estado Confirmado */}
                    {order.status === 'processing' && !cancelRequested && (
                      <button
                        onClick={handleCancelShipment}
                        disabled={cancelling}
                        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest border border-red-500/30 hover:border-red-400 text-red-400 hover:text-red-300 px-3 py-2 transition-colors disabled:opacity-40"
                      >
                        <XCircle size={10} />
                        {cancelling ? 'Enviando...' : 'Cancelar envío'}
                      </button>
                    )}
                  </div>
                  {cancelRequested && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
                      ✓ Solicitud enviada — confirmá desde el email
                    </p>
                  )}
                  {cancelError && (
                    <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest">
                      [ Error ] {cancelError}
                    </p>
                  )}
                </div>
              ) : order.status === 'processing' ? (
                <div className="border border-steel/15 bg-surface-dark/60 px-3 py-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-steel/50">
                    Generando etiqueta en Envia.com...
                  </p>
                </div>
              ) : null}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-surface-mid p-3">
      <p className="font-mono text-[9px] uppercase tracking-widest text-steel/60 mb-0.5">{label}</p>
      <p className={cn(mono ? 'font-mono' : 'font-sans', 'text-ash text-sm')}>{value}</p>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Muestra "hace X seg / min" actualizado en tiempo real
// ───────────────────────────────────────────────────────────
function LiveTimestamp({ date }: { date: Date }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  const label = diffSec < 10
    ? 'Ahora mismo'
    : diffSec < 60
    ? `Hace ${diffSec}s`
    : `Hace ${Math.floor(diffSec / 60)}min`

  return <>{label}</>
}

// ───────────────────────────────────────────────────────────
// Vista detallada del comprobante (imagen + datos)
// Maneja 3 casos: solo imagen, solo datos manuales, o ambos
// ───────────────────────────────────────────────────────────
async function downloadFile(url: string, baseName: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const ext = blob.type === 'application/pdf' ? 'pdf'
      : blob.type === 'image/png' ? 'png'
      : blob.type === 'image/webp' ? 'webp'
      : 'jpg'
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `${baseName}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch {
    alert('No se pudo descargar el archivo')
  }
}

function TransferProofDetail({ proof }: { proof: NonNullable<Order['transferProof']> }) {
  const [imageOpen, setImageOpen] = useState(false)
  const hasImage = !!proof.receiptImageUrl
  const hasManualData = !!(proof.fromBank || proof.reference)

  const submittedAt = new Date(proof.submittedAt).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex flex-col gap-3">
      {/* Modo de envío */}
      <p className="font-mono text-[9px] uppercase tracking-widest text-steel/60">
        {hasImage && hasManualData
          ? 'Modo: imagen + datos manuales'
          : hasImage
          ? 'Modo: solo imagen del comprobante'
          : 'Modo: solo datos manuales'}
      </p>

      {/* ── Preview de imagen del comprobante ── */}
      {hasImage && (
        <button
          onClick={() => setImageOpen(true)}
          className="relative group border border-steel/20 bg-surface-dark overflow-hidden hover:border-gold/50 transition-colors"
          aria-label="Ver comprobante en grande"
        >
          <img
            src={proof.receiptImageUrl}
            alt="Comprobante de transferencia"
            className="w-full h-64 object-contain bg-surface-dark"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-surface-dark/0 group-hover:bg-surface-dark/60 transition-colors flex items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ash opacity-0 group-hover:opacity-100 transition-opacity border border-gold px-3 py-1.5">
              <Eye size={11} className="inline mr-1.5 -mt-0.5" />
              Ver completo
            </span>
          </div>
          <div className="absolute top-2 right-2 font-mono text-[9px] uppercase tracking-widest text-steel/60 bg-surface-dark/80 px-2 py-1">
            <Receipt size={10} className="inline mr-1 -mt-0.5" />
            Comprobante
          </div>
        </button>
      )}

      {/* ── Datos manuales en grid ── */}
      {hasManualData && (
        <div className="grid grid-cols-2 gap-px bg-steel/10">
          {proof.transferDate && (
            <DetailCell
              label="Fecha"
              value={new Date(proof.transferDate).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            />
          )}
          {proof.amount !== undefined && proof.amount > 0 && (
            <DetailCell label="Monto" value={formatCurrency(proof.amount)} mono />
          )}
          {proof.fromBank && <DetailCell label="Banco emisor" value={proof.fromBank} />}
          {proof.reference && <DetailCell label="Nº operación" value={proof.reference} mono />}
        </div>
      )}

      {/* Notas (común a ambos modos) */}
      {proof.notes && (
        <div className="border border-steel/15 bg-surface-dark p-3">
          <p className="font-mono text-[9px] uppercase tracking-widest text-steel/60 mb-1">
            Notas del cliente
          </p>
          <p className="font-sans text-sm text-ash/80">{proof.notes}</p>
        </div>
      )}

      {/* Acciones: link a abrir en nueva tab + descarga */}
      {hasImage && (
        <div className="flex gap-2">
          <a
            href={proof.receiptImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 border border-steel/30 hover:border-gold hover:text-gold text-steel font-mono text-[10px] uppercase tracking-widest py-2 transition-colors"
          >
            <Eye size={11} />
            Abrir en nueva pestaña
          </a>
          <button
            onClick={() => downloadFile(proof.receiptImageUrl!, `comprobante-${proof.reference || 'transferencia'}`)}
            className="flex-1 inline-flex items-center justify-center gap-2 border border-steel/30 hover:border-gold hover:text-gold text-steel font-mono text-[10px] uppercase tracking-widest py-2 transition-colors"
          >
            <Receipt size={11} />
            Descargar
          </button>
        </div>
      )}

      {/* Timestamp */}
      <p className="font-mono text-[9px] uppercase tracking-widest text-steel/40 mt-1">
        Recibido el {submittedAt}
      </p>

      {/* Lightbox / Modal de imagen */}
      {imageOpen && hasImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setImageOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-ash hover:text-gold transition-colors"
            onClick={(e) => { e.stopPropagation(); setImageOpen(false) }}
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
          <img
            src={proof.receiptImageUrl}
            alt="Comprobante"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
