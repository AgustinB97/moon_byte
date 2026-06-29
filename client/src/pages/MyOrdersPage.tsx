import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ArrowRight, ShoppingBag } from 'lucide-react'
import { getMyOrders } from '@/services/orders'
import { Button, StatusBadge } from '@/components/ui'
import { formatCurrency, cn } from '@/utils'
import type { Order } from '@/types'

export function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <div className="grid gap-px bg-steel/10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface-mid animate-pulse" />
          ))}
        </div>
      </main>
    )
  }

  if (orders.length === 0) {
    return (
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <ShoppingBag size={48} className="text-steel/20" />
        <div className="text-center">
          <p className="font-display text-3xl uppercase tracking-tightest text-ash/40">
            Sin pedidos todavía
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel/30 mt-1">
            Cuando hagas tu primera compra, va a aparecer acá
          </p>
        </div>
        <Link to="/productos">
          <Button size="lg">Explorar catálogo</Button>
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
          [ Mi cuenta ]
        </p>
        <h1 className="font-display text-[clamp(2rem,6vw,5rem)] uppercase tracking-tightest text-ash">
          Mis Pedidos
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mt-1">
          {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
        </p>
      </div>

      <div className="grid gap-px bg-steel/10">
        {orders.map((order, i) => (
          <OrderCard key={order._id} order={order} index={i} />
        ))}
      </div>
    </main>
  )
}

function OrderCard({ order, index }: { order: Order; index: number }) {
  const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <Link
      to={`/pedidos/${order._id}`}
      className={cn(
        'group flex gap-4 md:gap-6 bg-surface-mid p-4 md:p-5',
        'hover:bg-surface-light transition-colors duration-300'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Icon */}
      <div className="w-12 h-12 md:w-14 md:h-14 border border-steel/20 flex items-center justify-center flex-shrink-0 group-hover:border-gold/40 transition-colors">
        <Package size={20} className="text-steel group-hover:text-gold transition-colors" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-gold">
            #{order._id.slice(-6).toUpperCase()}
          </span>
          <span className="font-mono text-[9px] text-steel/30">///</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-steel/60">
            {date}
          </span>
        </div>

        <p className="font-sans text-sm text-ash mb-1">
          {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
        </p>

        <p className="font-mono text-[10px] uppercase tracking-widest text-steel/50 truncate">
          {order.items.map((i) => i.name).slice(0, 2).join(', ')}
          {order.items.length > 2 && `, +${order.items.length - 2} más`}
        </p>
      </div>

      {/* Status + Total */}
      <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
        <StatusBadge status={order.status} />
        <div className="flex items-center gap-2">
          <span className="font-mono text-base md:text-lg text-gold">
            {formatCurrency(order.total)}
          </span>
          <ArrowRight
            size={14}
            className="text-steel/40 group-hover:text-gold group-hover:translate-x-1 transition-all duration-300"
          />
        </div>
      </div>
    </Link>
  )
}
