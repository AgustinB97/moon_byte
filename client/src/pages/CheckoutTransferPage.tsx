import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { BankInfoCard } from '@/components/features/BankInfoCard'
import { TransferProofForm } from '@/components/features/TransferProofForm'
import { useCartStore } from '@/store/cartStore'
import { getOrderById } from '@/services/orders'
import type { BankInfo, Order } from '@/types'

interface PageData {
  orderId: string
  total: number
  bankInfo: BankInfo
}

export function CheckoutTransferPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const clearCart = useCartStore((s) => s.clearCart)

  const [data, setData] = useState<PageData | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Guard: StrictMode monta 2× — sin el ref, la 2da pasada borra el sessionStorage
  // antes de que la pantalla termine de hidratar
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current || !orderId) return
    loadedRef.current = true

    // Cache rápido si vienes del checkout, fallback al backend si recargás o
    // entrás desde un link
    const cached = sessionStorage.getItem('transferCheckout')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as PageData
        if (parsed.orderId === orderId) {
          setData(parsed)
          clearCart()
          sessionStorage.removeItem('transferCheckout')
          setIsLoading(false)
          return
        }
      } catch {
        // JSON corrupto → ignorar y fetch
      }
    }

    getOrderById(orderId)
      .then((fetched) => {
        setOrder(fetched)
        if (fetched.paymentMethod !== 'transferencia') {
          setError('Este pedido no se paga por transferencia.')
          return
        }
        if (fetched.bankInfo) {
          setData({
            orderId: fetched._id,
            total: fetched.total,
            bankInfo: fetched.bankInfo,
          })
        } else {
          // Sin bankInfo → la orden ya fue confirmada por admin, redirect al detalle
          navigate(`/pedidos/${orderId}`, { replace: true })
        }
      })
      .catch(() => setError('No pudimos cargar tu pedido'))
      .finally(() => setIsLoading(false))
  }, [orderId, clearCart, navigate])

  if (isLoading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-4">
        <Loader2 size={32} className="text-gold animate-spin" />
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-surface-mid border border-steel/20 p-8">
            <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-red-400 mb-2">
              [ Error ]
            </p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-steel mb-6">
              {error ?? 'No encontramos los datos de tu pedido'}
            </p>
            <Link to="/pedidos">
              <Button size="md" className="w-full">Ir a mis pedidos</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const shortOrderCode = `#${data.orderId.slice(-6).toUpperCase()}`

  return (
    <main className="min-h-[100dvh] flex items-start justify-center px-4 pt-20 pb-12">
      <div className="fixed inset-0 grid-line opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-2xl">
        {/* Bank info — variant full (incluye header, monto grande, instrucciones) */}
        <BankInfoCard
          bankInfo={data.bankInfo}
          amount={data.total}
          orderId={data.orderId}
          variant="full"
          className="animate-reveal"
        />

        {/* Actions */}
        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <Link to={`/pedidos/${data.orderId}`} className="flex-1">
            <Button variant="outline" size="lg" className="w-full group">
              Ver mi pedido
              <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/productos" className="flex-1">
            <Button variant="ghost" size="lg" className="w-full">
              Seguir comprando
            </Button>
          </Link>
        </div>

        <p className="text-center font-mono text-[9px] uppercase tracking-widest text-steel/40 mt-6">
          También te enviamos los datos por email · {shortOrderCode}
        </p>

        {/* Form de comprobante */}
        <div id="comprobante" className="mt-8 scroll-mt-24">
          <TransferProofForm
            orderId={data.orderId}
            expectedAmount={data.total}
            existingProof={order?.transferProof}
            onSubmitted={setOrder}
          />
        </div>
      </div>
    </main>
  )
}
