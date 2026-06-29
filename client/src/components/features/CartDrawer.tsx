import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency, cn } from '@/utils'
import { Button } from '@/components/ui'

export function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, total, itemCount } = useCartStore()
  const cartTotal = total()
  const count = itemCount()

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-all duration-500',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={toggleCart}
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-surface-dark border-l border-steel/20',
          'flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-steel/20">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel">
              [ Carrito ]
            </p>
            <p className="font-display text-lg text-ash uppercase tracking-tightest">
              {count} {count === 1 ? 'Item' : 'Items'}
            </p>
          </div>
          <button
            onClick={toggleCart}
            className="p-2 text-steel hover:text-ash transition-colors"
            aria-label="Cerrar carrito"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-5 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
              <ShoppingBag size={40} className="text-steel/30" />
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel/50">
                Carrito vacío
              </p>
              <Button variant="outline" size="sm" onClick={toggleCart}>
                Explorar productos
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product._id}
                className="flex gap-3 border border-steel/15 p-3 group"
              >
                {/* Image */}
                <div className="w-16 h-16 bg-surface-mid flex-shrink-0 overflow-hidden">
                  <img
                    src={item.product.images[0] ?? '/placeholder.jpg'}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-steel truncate">
                    {item.product.brand}
                  </p>
                  <p className="font-sans text-xs text-ash leading-snug mt-0.5 line-clamp-2">
                    {item.product.name}
                  </p>
                  <p className="font-mono text-sm text-gold mt-1">
                    {formatCurrency(item.product.price)}
                  </p>

                  {/* Quantity */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      className="w-6 h-6 border border-steel/30 flex items-center justify-center text-steel hover:border-gold hover:text-gold transition-colors"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="font-mono text-xs text-ash w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      className="w-6 h-6 border border-steel/30 flex items-center justify-center text-steel hover:border-gold hover:text-gold transition-colors"
                    >
                      <Plus size={10} />
                    </button>
                    <button
                      onClick={() => removeItem(item.product._id)}
                      className="ml-auto font-mono text-[9px] uppercase tracking-widest text-steel/40 hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-steel/20 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-steel">
                Total
              </span>
              <span className="font-mono text-xl text-gold">
                {formatCurrency(cartTotal)}
              </span>
            </div>
            <div className="h-px w-full bg-steel/10" />
            <Link to="/carrito" onClick={toggleCart}>
              <Button className="w-full group" size="lg">
                Finalizar Compra
                <span className="ml-auto transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight size={14} />
                </span>
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
