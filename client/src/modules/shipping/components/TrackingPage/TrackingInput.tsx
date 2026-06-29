import { useState } from 'react'
import { Search } from 'lucide-react'

interface TrackingInputProps {
  onBuscar: (nro: string) => void
  loading: boolean
  initialValue?: string
}

export function TrackingInput({ onBuscar, loading, initialValue = '' }: TrackingInputProps) {
  const [nro, setNro] = useState(initialValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nro.trim()) onBuscar(nro.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1">
        <label
          htmlFor="tracking-nro"
          className="font-mono text-[10px] uppercase tracking-widest text-steel block mb-1.5"
        >
          Número de seguimiento
        </label>
        <input
          id="tracking-nro"
          type="text"
          value={nro}
          onChange={(e) => setNro(e.target.value)}
          placeholder="Ej: AND123456789"
          className="w-full bg-surface-dark border border-steel/30 text-ash font-mono text-sm px-4 py-3 focus:outline-none focus:border-gold/60 transition-colors"
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={!nro.trim() || loading}
          aria-label="Rastrear envío"
          className="w-full sm:w-auto font-mono text-[10px] uppercase tracking-widest px-5 py-3 bg-gold text-surface-dark hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Search size={13} />
          Rastrear
        </button>
      </div>
    </form>
  )
}
