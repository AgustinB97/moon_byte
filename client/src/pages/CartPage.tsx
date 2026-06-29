import { Link } from 'react-router-dom'
import { Trash2, Minus, Plus, ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/utils'

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCartStore()
  const cartTotal = total()
  const count = itemCount()
  const shipping = cartTotal > 50000 ? 0 : 4500

  if (items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <ShoppingBag size={48} className="text-steel/20" />
        <div className="text-center">
          <p className="font-display text-3xl uppercase tracking-tightest text-ash/40">
            Carrito vacío
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel/30 mt-1">
            Todavía no agregaste productos
          </p>
        </div>
        <Link to="/productos">
          <Button size="lg">Explorar catálogo</Button>
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
          [ Carrito ]
        </p>
        <h1 className="font-display text-[clamp(2rem,6vw,5rem)] uppercase tracking-tightest text-ash">
          Tu Selección
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mt-1">
          {count} {count === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Items */}
        <div className="md:col-span-2 flex flex-col gap-px bg-steel/10">
          {items.map((item) => (
            <div
              key={item.product._id}
              className="flex gap-4 p-4 bg-surface-mid group"
            >
              <Link to={`/productos/${item.product.slug}`} className="flex-shrink-0">
                <div className="w-20 h-20 bg-surface-dark overflow-hidden">
                  <img
                    src={item.product.images[0] ?? '/placeholder.jpg'}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="font-mono text-[9px] uppercase tracking-widest text-steel">
                  {item.product.brand}
                </p>
                <Link
                  to={`/productos/${item.product.slug}`}
                  className="font-sans text-sm text-ash hover:text-gold transition-colors line-clamp-2"
                >
                  {item.product.name}
                </Link>
                <p className="font-mono text-base text-gold mt-auto">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>

              <div className="flex flex-col items-end justify-between gap-2">
                <button
                  onClick={() => removeItem(item.product._id)}
                  className="text-steel/40 hover:text-red-400 transition-colors"
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>

                <div className="flex items-center border border-steel/20">
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center text-steel hover:text-gold transition-colors"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="w-8 text-center font-mono text-xs text-ash">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center text-steel hover:text-gold transition-colors"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="md:col-span-1">
          <div className="border border-steel/20 bg-surface-mid p-5 sticky top-24">
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-4">
              [ Resumen ]
            </p>

            <div className="flex flex-col gap-3 mb-4">
              <div className="flex justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-steel">
                  Subtotal
                </span>
                <span className="font-mono text-sm text-ash">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-steel">
                  Envío
                </span>
                <span className="font-mono text-sm text-ash">
                  {shipping === 0 ? (
                    <span className="text-emerald-400">Gratis</span>
                  ) : formatCurrency(shipping)}
                </span>
              </div>
            </div>

            {shipping > 0 && (
              <p className="font-mono text-[9px] text-steel/40 uppercase tracking-widest mb-4">
                Envío gratis en compras +{formatCurrency(50000)}
              </p>
            )}

            <div className="h-px bg-steel/15 mb-4" />

            <div className="flex justify-between mb-6">
              <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Total</span>
              <span className="font-mono text-2xl text-gold">{formatCurrency(cartTotal + shipping)}</span>
            </div>

            <Link to="/checkout">
              <Button size="lg" className="w-full group mb-3">
                Finalizar compra
                <ArrowRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <button
              onClick={clearCart}
              className="w-full font-mono text-[10px] uppercase tracking-widest text-steel/40 hover:text-red-400 transition-colors py-2"
            >
              Vaciar carrito
            </button>
          </div>
        </div>
      </div>

      <Link
        to="/productos"
        className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-colors"
      >
        <ArrowLeft size={12} />
        Seguir comprando
      </Link>
    </main>
  )
}
