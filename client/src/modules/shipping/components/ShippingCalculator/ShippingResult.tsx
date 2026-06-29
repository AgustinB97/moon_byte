import { Truck } from 'lucide-react'
import type { OpcionEnvio } from '../../types/shipping.types'

const formatPrecio = (price: string) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(parseFloat(price))

interface ShippingResultProps {
  opcion: OpcionEnvio
  onConfirmar?: () => void
}

export function ShippingResult({ opcion, onConfirmar }: ShippingResultProps) {
  return (
    <div className="border border-purple-500/30 bg-surface-dark p-4">
      {/* Carrier */}
      <div className="flex items-center gap-2 mb-3">
        <Truck size={13} style={{ color: '#a855f7' }} />
        <span
          className="font-mono text-[10px] uppercase tracking-widest font-semibold"
          style={{ color: '#a855f7' }}
        >
          {opcion.carrier}
        </span>
      </div>

      {/* Detalle */}
      <p className="font-sans text-sm font-semibold text-ash mb-0.5">
        {opcion.serviceDescription}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-steel/60 mb-4">
        {opcion.deliveryEstimate}
      </p>

      {/* Precio + CTA */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-2xl text-gold">
          {formatPrecio(opcion.totalPrice)}
        </span>
        {onConfirmar && (
          <button
            onClick={onConfirmar}
            className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 bg-gold text-surface-dark hover:opacity-90 transition-opacity"
          >
            Confirmar envío
          </button>
        )}
      </div>
    </div>
  )
}
