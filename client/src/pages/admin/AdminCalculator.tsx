import { useState } from 'react'
import { PriceCalculator } from '@/components/admin/PriceCalculator'
import { Input } from '@/components/ui'

export function AdminCalculator() {
  const [cost, setCost] = useState('')

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
          [ Admin / Calculadora ]
        </p>
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] uppercase tracking-tightest text-ash">
          Calculadora
          <br />
          <span className="text-gold">de Precios</span>
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel/50 mt-2">
          Probá rápido cuánto sale un producto antes de cargarlo
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="Costo del producto"
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="Ingresá lo que pagaste, ej: 350000"
          icon={<span className="font-mono text-xs text-steel">$</span>}
        />

        <PriceCalculator cost={Number(cost) || 0} showFormulas />
      </div>
    </div>
  )
}
