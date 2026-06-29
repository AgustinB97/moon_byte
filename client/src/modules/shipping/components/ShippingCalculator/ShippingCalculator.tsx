import { useState, useEffect, useRef } from 'react'
import { useCotizarEnvio } from '../../hooks/useCotizarEnvio'
import { ShippingResult } from './ShippingResult'
import type { CotizacionRequest, OpcionEnvio } from '../../types/shipping.types'

function QuoteSkeleton() {
  return (
    <div className="border border-steel/15 bg-surface-dark p-4 animate-pulse">
      <div className="h-3 bg-steel/20 w-20 mb-3 rounded-sm" />
      <div className="h-5 bg-steel/20 w-48 mb-2 rounded-sm" />
      <div className="h-3 bg-steel/20 w-32 mb-5 rounded-sm" />
      <div className="h-9 bg-steel/20 w-full rounded-sm" />
    </div>
  )
}

interface ShippingCalculatorProps {
  cpOrigen: string
  pesoKg: number
  valorDeclarado: number
  dimensiones: { largo: number; ancho: number; alto: number }
  contenido?: string
  onOpcionConfirmada?: (opcion: OpcionEnvio, cpDestino: string) => void
  /** CP pre-llenado desde afuera (ej: dirección del checkout). Se sincroniza al cambiar. */
  cpSugerido?: string
}

export function ShippingCalculator({
  cpOrigen, pesoKg, valorDeclarado, dimensiones,
  contenido = 'Hardware y componentes informaticos',
  onOpcionConfirmada, cpSugerido,
}: ShippingCalculatorProps) {
  const [cpDestino, setCpDestino] = useState('')
  const { cotizar, opcion, loading, error, reset } = useCotizarEnvio()
  const prevSugerido = useRef('')

  // Sincronizar CP externo (solo cuando cambia, sin re-calcular automático)
  useEffect(() => {
    if (!cpSugerido) return
    const digits = cpSugerido.replace(/\D/g, '').slice(0, 4)
    if (digits === prevSugerido.current) return
    prevSugerido.current = digits
    setCpDestino(digits)
  }, [cpSugerido])

  const handleCalcular = () => {
    if (cpDestino.length !== 4) return
    const params: CotizacionRequest = {
      cpOrigen, cpDestino, pesoKg, contenido, valorDeclarado,
      largo: dimensiones.largo, ancho: dimensiones.ancho, alto: dimensiones.alto,
    }
    void cotizar(params)
  }

  const handleCpChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4)
    setCpDestino(digits)
    if (opcion) reset()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label htmlFor="cp-destino" className="font-mono text-[10px] uppercase tracking-widest text-steel block mb-1.5">
            Código postal de destino
          </label>
          <input
            id="cp-destino"
            type="text"
            inputMode="numeric"
            value={cpDestino}
            onChange={(e) => handleCpChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCalcular()}
            placeholder="1043"
            maxLength={4}
            className="w-full bg-surface-dark border border-steel/30 text-ash font-mono text-sm px-4 py-3 focus:outline-none focus:border-gold/60 transition-colors"
          />
        </div>
        <button
          onClick={handleCalcular}
          disabled={cpDestino.length !== 4 || loading}
          className="font-mono text-[10px] uppercase tracking-widest px-4 py-3 border border-steel/30 text-steel hover:border-gold/50 hover:text-ash transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Calcular envío
        </button>
      </div>

      {loading && <QuoteSkeleton />}

      {error && !loading && (
        <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-red-400 flex-1">{error}</p>
          <button
            onClick={handleCalcular}
            className="font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-colors whitespace-nowrap"
          >
            Reintentar
          </button>
        </div>
      )}

      {opcion && !loading && (
        <ShippingResult
          opcion={opcion}
          onConfirmar={onOpcionConfirmada ? () => onOpcionConfirmada(opcion, cpDestino) : undefined}
        />
      )}
    </div>
  )
}
