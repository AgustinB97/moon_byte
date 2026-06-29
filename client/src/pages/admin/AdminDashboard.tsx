import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Package, ShoppingBag, AlertTriangle, Users, ArrowRight } from 'lucide-react'
import { getDashboardStats, type DashboardStats } from '@/services/admin'
import { StatusBadge } from '@/components/ui'
import { formatCurrency, cn } from '@/utils'

type IconType = typeof TrendingUp

const KPI_CONFIG: Array<{
  key: keyof DashboardStats | 'salesTodayTotal' | 'salesTodayCount'
  label: string
  icon: IconType
  format?: (n: number) => string
  href?: string
}> = [
  { key: 'salesTodayTotal', label: 'Ventas hoy', icon: TrendingUp, format: formatCurrency },
  { key: 'salesTodayCount', label: 'Pedidos hoy', icon: ShoppingBag, href: '/admin/pedidos' },
  { key: 'pendingOrders', label: 'Pendientes', icon: Package, href: '/admin/pedidos?status=pending' },
  { key: 'lowStockCount', label: 'Stock crítico', icon: AlertTriangle, href: '/admin/productos' },
  { key: 'totalProducts', label: 'Productos', icon: Package, href: '/admin/productos' },
  { key: 'totalUsers', label: 'Usuarios', icon: Users },
]

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
          [ Admin / Dashboard ]
        </p>
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] uppercase tracking-tightest text-ash">
          Resumen
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel/50 mt-1">
          Datos en tiempo real · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-steel/10 mb-8">
        {KPI_CONFIG.map((kpi) => {
          let value: number = 0
          if (stats) {
            if (kpi.key === 'salesTodayTotal') value = stats.salesToday.total
            else if (kpi.key === 'salesTodayCount') value = stats.salesToday.count
            else value = stats[kpi.key as keyof DashboardStats] as number
          }
          const formatted = kpi.format ? kpi.format(value) : String(value)
          const Wrapper = kpi.href
            ? ({ children, className }: { children: React.ReactNode; className: string }) => (
                <Link to={kpi.href!} className={className}>{children}</Link>
              )
            : ({ children, className }: { children: React.ReactNode; className: string }) => (
                <div className={className}>{children}</div>
              )

          return (
            <Wrapper
              key={kpi.key}
              className={cn(
                'group bg-surface-mid p-5 flex flex-col gap-3 relative overflow-hidden',
                kpi.href && 'hover:bg-surface-light transition-colors cursor-pointer'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 border border-gold/20 flex items-center justify-center">
                  <kpi.icon size={14} className="text-gold" />
                </div>
                {kpi.href && (
                  <ArrowRight
                    size={14}
                    className="text-steel/30 group-hover:text-gold group-hover:translate-x-1 transition-all"
                  />
                )}
              </div>
              <div>
                <p className="font-display text-2xl md:text-3xl text-ash tracking-tightest">
                  {isLoading ? '—' : formatted}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-steel/50 mt-1">
                  {kpi.label}
                </p>
              </div>
            </Wrapper>
          )
        })}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel">
            [ Últimos pedidos ]
          </p>
          <Link
            to="/admin/pedidos"
            className="font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {!stats || stats.recentOrders.length === 0 ? (
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel/40 py-8 text-center border border-steel/15 bg-surface-mid">
            No hay pedidos todavía
          </p>
        ) : (
          <div className="grid gap-px bg-steel/10">
            {stats.recentOrders.map((order) => (
              <Link
                key={order._id}
                to={`/admin/pedidos`}
                className="bg-surface-mid p-4 flex items-center gap-4 hover:bg-surface-light transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-gold">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="font-mono text-[9px] text-steel/30">///</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-steel/50">
                      {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-ash/70 truncate">
                    {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
                <StatusBadge status={order.status} />
                <span className="font-mono text-base text-gold whitespace-nowrap">
                  {formatCurrency(order.total)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
