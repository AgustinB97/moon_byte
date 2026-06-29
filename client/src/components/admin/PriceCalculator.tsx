import { Calculator, Building2, CreditCard } from 'lucide-react'
import { calculatePrices, PRICING } from '@/utils/pricing'
import { formatCurrency, cn } from '@/utils'

interface PriceCalculatorProps {
  cost: number
  showFormulas?: boolean
  className?: string
}

/**
 * Muestra los 2 precios calculados a partir de un costo.
 * Solo display — el input lo maneja el padre.
 */
export function PriceCalculator({ cost, showFormulas = false, className }: PriceCalculatorProps) {
  const { priceWithMP, priceCash, cashDiscountPercent } = calculatePrices(cost)
  const profit = cost > 0 ? Math.round(priceWithMP - cost) : 0

  return (
    <div className={cn('border border-gold/30 bg-surface-dark p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Calculator size={12} className="text-gold" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
          [ Calculadora de precios ]
        </p>
      </div>

      {cost > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-px bg-steel/10 mb-3">
            {/* Transferencia */}
            <div className="bg-surface-mid p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Building2 size={11} className="text-emerald-400" />
                <p className="font-mono text-[9px] uppercase tracking-widest text-emerald-400">
                  Transferencia
                </p>
              </div>
              <p className="font-mono text-lg text-ash leading-none">
                {formatCurrency(priceCash)}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-emerald-400/70 mt-1.5">
                −{cashDiscountPercent}% vs MP
              </p>
            </div>

            {/* MP */}
            <div className="bg-surface-mid p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CreditCard size={11} className="text-gold" />
                <p className="font-mono text-[9px] uppercase tracking-widest text-gold">
                  Con MP
                </p>
              </div>
              <p className="font-mono text-lg text-gold leading-none">
                {formatCurrency(priceWithMP)}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-steel/50 mt-1.5">
                tarjeta / cuotas
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-steel/60">
            <span>Ganancia bruta (con MP):</span>
            <span className="text-ash">{formatCurrency(profit)}</span>
          </div>
        </>
      ) : (
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel/40 py-2">
          Ingresá un costo arriba para ver los precios calculados
        </p>
      )}

      {showFormulas && (
        <details className="mt-3 pt-3 border-t border-steel/10">
          <summary className="font-mono text-[9px] uppercase tracking-widest text-steel/50 cursor-pointer hover:text-gold">
            [ Ver fórmulas ]
          </summary>
          <div className="mt-2 space-y-1.5 font-mono text-[10px] text-steel/60">
            <p>Markup: <span className="text-ash">×{PRICING.MARKUP}</span></p>
            <p>Transferencia: <span className="text-ash">(costo × {PRICING.MARKUP}) / {PRICING.DIVISOR_CASH}</span></p>
            <p>Con MP:        <span className="text-ash">(costo × {PRICING.MARKUP}) / {PRICING.DIVISOR_MP}</span></p>
          </div>
        </details>
      )}
    </div>
  )
}
