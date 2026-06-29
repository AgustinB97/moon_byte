import { Link } from 'react-router-dom'
import { ShoppingCart, Zap } from 'lucide-react'
import type { Product } from '@/types'
import { formatDiscount, cn } from '@/utils'
import { useCartStore } from '@/store/cartStore'
import { Badge, StarRating } from '@/components/ui'
import { PriceDisplay } from '@/components/features/PriceDisplay'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const discount = product.comparePrice
    ? formatDiscount(product.comparePrice, product.price)
    : null

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product)
  }

  return (
    <Link
      to={`/productos/${product.slug}`}
      className={cn(
        'group relative flex flex-col bg-surface-mid border border-steel/15',
        'hover:border-gold/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface-dark">
        <img
          src={product.images[0] ?? 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-surface-dark/0 group-hover:bg-surface-dark/20 transition-all duration-500" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount && (
            <Badge variant="gold">-{discount}%</Badge>
          )}
          {product.featured && (
            <Badge variant="steel">
              <Zap size={8} className="mr-1" />
              Top
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="danger">Sin stock</Badge>
          )}
        </div>

        {/* Add to cart button (appears on hover) */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={cn(
            'absolute bottom-2 right-2 w-9 h-9 bg-gold text-surface-dark',
            'flex items-center justify-center',
            'translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
            'transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
            'hover:bg-gold-light active:scale-95',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          aria-label="Agregar al carrito"
        >
          <ShoppingCart size={15} />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <p className="font-mono text-[9px] uppercase tracking-widest text-steel">
          {product.brand}
        </p>

        <h3 className="font-sans text-sm text-ash leading-snug group-hover:text-gold/90 transition-colors duration-200 line-clamp-2">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <StarRating rating={product.rating} size={10} />
          <span className="font-mono text-[9px] text-steel/50">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-2 flex items-end justify-between">
          <PriceDisplay product={product} size="md" />

          {/* Technical corner marker */}
          <span className="font-mono text-[8px] text-steel/20 uppercase tracking-widest self-start mt-1">
            SKU/{product._id.slice(-4).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Bottom gold line on hover */}
      <div className="h-px w-0 group-hover:w-full bg-gold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" />
    </Link>
  )
}
