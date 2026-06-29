import { useState, useEffect, useRef, useCallback } from 'react'
import { Check } from 'lucide-react'
import { ShippingCalculator } from '../ShippingCalculator/ShippingCalculator'
import type { OpcionEnvio } from '../../types/shipping.types'

const formatPrecio = (price: string) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(parseFloat(price))

interface ShippingSelectorProps {
  cpOrigen: string
  pesoKg: number
  valorDeclarado: number
  dimensiones: { largo: number; ancho: number; alto: number }
  onContinuar: (opcion: OpcionEnvio, cpDestino: string) => void
  /** Llamado cuando el usuario cancela la confirmación (para limpiar el total en el padre) */
  onCancelar?: () => void
  /** CP sugerido desde el formulario de dirección para pre-llenar el input */
  cpSugerido?: string
}

export function ShippingSelector({
  cpOrigen, pesoKg, valorDeclarado, dimensiones,
  onContinuar, onCancelar, cpSugerido,
}: ShippingSelectorProps) {
  const [confirmed, setConfirmed] = useState<{ opcion: OpcionEnvio; cp: string } | null>(null)
  const prevCp = useRef('')
  // Ref para onCancelar: evita que el cambio de referencia de la función dispare el efecto
  const onCancelarRef = useRef(onCancelar)
  onCancelarRef.current = onCancelar

  // Si el CP sugerido cambia respecto al que se confirmó, resetear la confirmación
  useEffect(() => {
    if (!cpSugerido) return
    const digits = cpSugerido.replace(/\D/g, '').slice(0, 4)
    if (digits.length !== 4) return
    if (digits === prevCp.current) return
    prevCp.current = digits

    if (confirmed && confirmed.cp !== digits) {
      setConfirmed(null)
      onCancelarRef.current?.()
    }
  }, [cpSugerido, confirmed]) // onCancelar via ref — no dispara el efecto al cambiar de referencia

  const handleConfirm = (opcion: OpcionEnvio, cp: string) => {
    prevCp.current = cp
    setConfirmed({ opcion, cp })
    onContinuar(opcion, cp)
  }

  const handleCambiar = useCallback(() => {
    setConfirmed(null)
    onCancelarRef.current?.()
  }, [])

  if (confirmed) {
    return (
      <div className="border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 flex items-center gap-3">
        <Check size={13} className="text-emerald-400 flex-shrink-0" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 flex-1 truncate">
          {confirmed.opcion.carrier} · {formatPrecio(confirmed.opcion.totalPrice)} · {confirmed.opcion.deliveryEstimate}
        </p>
        <button
          onClick={handleCambiar}
          className="font-mono text-[9px] uppercase tracking-widest text-steel hover:text-gold transition-colors whitespace-nowrap"
        >
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <ShippingCalculator
      cpOrigen={cpOrigen}
      pesoKg={pesoKg}
      valorDeclarado={valorDeclarado}
      dimensiones={dimensiones}
      onOpcionConfirmada={handleConfirm}
      cpSugerido={cpSugerido}
    />
  )
}
