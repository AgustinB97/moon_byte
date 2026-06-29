import type { OrderStatus } from '@/types'
import { cn } from '@/utils'

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string; dotClass: string }
> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-gold/15 text-gold border-gold/30',
    dotClass: 'bg-gold animate-pulse',
  },
  processing: {
    label: 'Confirmado',
    className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
    dotClass: 'bg-emerald-400',
  },
  shipped: {
    label: 'Enviado',
    className: 'bg-blue-400/15 text-blue-400 border-blue-400/30',
    dotClass: 'bg-blue-400 animate-pulse',
  },
  delivered: {
    label: 'Entregado',
    className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
    dotClass: 'bg-emerald-400',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-400/15 text-red-400 border-red-400/30',
    dotClass: 'bg-red-400',
  },
}

interface StatusBadgeProps {
  status: OrderStatus
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest border px-2 py-1',
        config.className,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5', config.dotClass)} />}
      {config.label}
    </span>
  )
}
