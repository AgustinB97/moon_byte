import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTracking } from '../../hooks/useTracking'
import { TrackingInput } from './TrackingInput'
import { TrackingTimeline } from './TrackingTimeline'

export function TrackingPage() {
  const [searchParams] = useSearchParams()
  const initialNro = searchParams.get('n') ?? undefined
  const { buscar, resultado, loading, error } = useTracking(initialNro)
  const [lastNro, setLastNro] = useState(initialNro ?? '')

  const handleBuscar = (nro: string) => {
    setLastNro(nro)
    void buscar(nro)
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
          [ Seguimiento ]
        </p>
        <h1 className="font-display text-[clamp(2rem,6vw,4rem)] uppercase tracking-tightest text-ash">
          Rastrear pedido
        </h1>
      </div>

      <div className="flex flex-col gap-5">
        <TrackingInput
          onBuscar={handleBuscar}
          loading={loading}
          initialValue={initialNro}
        />

        {error && (
          <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-red-400 flex-1">
              [ Error ] {error}
            </p>
            <button
              onClick={() => handleBuscar(lastNro)}
              disabled={!lastNro}
              className="font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-colors disabled:opacity-40"
            >
              Reintentar
            </button>
          </div>
        )}

        <TrackingTimeline resultado={resultado} loading={loading} />
      </div>
    </main>
  )
}
