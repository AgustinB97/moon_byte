import { cn } from '@/utils'
import type { TrackingEvento, TrackingResult } from '../../types/shipping.types'

const formatFecha = (ts: string) =>
  new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ts))

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  'In transit':  { label: 'En camino',        cls: 'bg-blue-900/40 text-blue-400 border-blue-400/30' },
  'in_transit':  { label: 'En camino',        cls: 'bg-blue-900/40 text-blue-400 border-blue-400/30' },
  'Delivered':   { label: 'Entregado',        cls: 'bg-emerald-900/40 text-emerald-400 border-emerald-400/30' },
  'delivered':   { label: 'Entregado',        cls: 'bg-emerald-900/40 text-emerald-400 border-emerald-400/30' },
  'pending':     { label: 'En preparación',   cls: 'bg-steel/10 text-steel/70 border-steel/20' },
}
const getStatus = (s: string) =>
  STATUS_MAP[s] ?? { label: 'Novedad en el envío', cls: 'bg-gold/10 text-gold border-gold/30' }

function EventoRow({ evento }: { evento: TrackingEvento }) {
  return (
    <div className="flex gap-4 py-3 border-b border-steel/10 last:border-0">
      <p className="font-mono text-[10px] text-steel/40 w-28 flex-shrink-0 pt-0.5">
        {formatFecha(evento.timestamp)}
      </p>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm text-ash">{evento.description}</p>
        {evento.location && (
          <p className="font-mono text-[9px] uppercase tracking-widest text-steel/40 mt-0.5">
            {evento.location}
          </p>
        )}
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex gap-4 py-3 border-b border-steel/10 animate-pulse">
      <div className="h-3 bg-steel/20 w-28 flex-shrink-0 mt-0.5 rounded-sm" />
      <div className="flex-1 h-4 bg-steel/20 rounded-sm" />
    </div>
  )
}

interface TrackingTimelineProps {
  resultado: TrackingResult | null
  loading: boolean
}

export function TrackingTimeline({ resultado, loading }: TrackingTimelineProps) {
  if (loading) {
    return (
      <div className="border border-steel/15 bg-surface-mid p-4">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }
  if (!resultado) return null

  const { label, cls } = getStatus(resultado.status)
  const eventos = [...resultado.eventos].reverse()

  return (
    <div className="border border-steel/15 bg-surface-mid">
      <div className="p-4 border-b border-steel/10 flex items-center gap-3 flex-wrap">
        <span className={cn('font-mono text-[10px] uppercase tracking-widest border px-2 py-1', cls)}>
          {label}
        </span>
        <span className="font-mono text-[10px] text-steel/40 uppercase tracking-widest">
          {resultado.carrier} · {resultado.trackingNumber}
        </span>
      </div>
      <div className="p-4">
        {eventos.length > 0
          ? eventos.map((ev, i) => <EventoRow key={i} evento={ev} />)
          : <p className="font-mono text-[10px] uppercase tracking-widest text-steel/40">Sin eventos registrados aún</p>
        }
      </div>
    </div>
  )
}
