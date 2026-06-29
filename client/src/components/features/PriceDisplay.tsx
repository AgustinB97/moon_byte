import { Building2 } from 'lucide-react'
import { cn, formatCurrency } from '@/utils'
import type { Product } from '@/types'

type Size = 'sm' | 'md' | 'lg' | 'xl'

interface PriceDisplayProps {
  product: Pick<Product, 'price' | 'priceCash' | 'comparePrice'>
  size?: Size
  showCash?: boolean
  showCompare?: boolean
  className?: string
}

/**
 * Muestra el precio MP grande + un hint debajo con el precio en efectivo.
 *
 *  $1.850.000          ← precio con MP (gold, grande)
 *  $2.100.000 tachado  ← precio comparativo opcional
 *  ◆ Efectivo $1.728.254 (-7%)  ← hint pequeño
 */
const SIZE_STYLES: Record<Size, { main: string; cash: string; compare: string }> = {
  sm: { main: 'text-base', cash: 'text-[9px]', compare: 'text-[10px]' },
  md: { main: 'text-xl', cash: 'text-[10px]', compare: 'text-xs' },
  lg: { main: 'text-2xl', cash: 'text-[11px]', compare: 'text-sm' },
  xl: { main: 'text-3xl md:text-4xl', cash: 'text-xs', compare: 'text-base' },
}

export function PriceDisplay({
  product,
  size = 'md',
  showCash = true,
  showCompare = true,
  className,
}: PriceDisplayProps) {
  const styles = SIZE_STYLES[size]
  const discountPercent =
    product.price > 0 && product.priceCash > 0
      ? Math.round(((product.price - product.priceCash) / product.price) * 100)
      : 0

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Compare price (tachado) */}
      {showCompare && product.comparePrice && product.comparePrice > product.price && (
        <span className={cn('font-mono text-steel/40 line-through', styles.compare)}>
          {formatCurrency(product.comparePrice)}
        </span>
      )}

      {/* Precio MP (principal) */}
      <span className={cn('font-mono text-gold leading-none', styles.main)}>
        {formatCurrency(product.price)}
      </span>

      {/* Hint efectivo */}
      {showCash && product.priceCash > 0 && product.priceCash !== product.price && (
        <span className={cn(
          'inline-flex items-center gap-1 font-mono uppercase tracking-widest text-emerald-400/80 mt-1',
          styles.cash
        )}>
          <Building2 size={10} />
          Transferencia {formatCurrency(product.priceCash)}
          {discountPercent > 0 && (
            <span className="text-emerald-400/60">(−{discountPercent}%)</span>
          )}
        </span>
      )}
    </div>
  )
}
