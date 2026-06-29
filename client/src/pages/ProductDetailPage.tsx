import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Meta } from '@/components/seo/Meta'
import { ShoppingCart, ArrowLeft, ChevronRight, Minus, Plus, Check, Truck } from 'lucide-react'
import { getProductBySlug } from '@/services/products'
import { useCartStore } from '@/store/cartStore'
import { Button, Badge, StarRating } from '@/components/ui'
import { PriceDisplay } from '@/components/features/PriceDisplay'
import { formatCurrency, formatDiscount, CATEGORY_LABELS, cn } from '@/utils'
import { ShippingCalculator } from '@/modules/shipping'
import type { Product } from '@/types'

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem, toggleCart } = useCartStore()

  // ── Datos de envío (hooks siempre antes de cualquier early return) ──
  const cpOrigen = import.meta.env.VITE_CP_ORIGEN ?? '1642'
  const pesoKg = useMemo(
    () => ((product?.weightGrams ?? product?.pesoEmbalado) ?? 500) / 1000,
    [product]
  )
  const dimensiones = useMemo(() => ({
    largo: (product?.dimensions?.depthCm  ?? product?.largo)  ?? 30,
    ancho: (product?.dimensions?.widthCm  ?? product?.ancho)  ?? 25,
    alto:  (product?.dimensions?.heightCm ?? product?.alto)   ?? 20,
  }), [product])

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    getProductBySlug(slug)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setIsLoading(false))
  }, [slug])

  const handleAddToCart = () => {
    if (!product) return
    addItem(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    toggleCart()
  }

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        <div className="grid md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-surface-mid" />
          <div className="flex flex-col gap-4">
            <div className="h-4 w-24 bg-surface-mid" />
            <div className="h-10 w-3/4 bg-surface-mid" />
            <div className="h-6 w-1/3 bg-surface-mid" />
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-steel/50">
          Producto no encontrado
        </p>
        <Link to="/productos">
          <Button variant="outline" size="sm">Volver al catálogo</Button>
        </Link>
      </main>
    )
  }

  const discount = product.comparePrice
    ? formatDiscount(product.comparePrice, product.price)
    : null

  return (
    <main className="max-w-7xl mx-auto px-4 pt-24 pb-16">
      <Meta
        title={product.name}
        description={product.description || `${product.brand} ${product.name} — MoonByte Hardware`}
        image={product.images[0]}
        canonical={`/productos/${product.slug}`}
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 font-mono text-[10px] uppercase tracking-widest">
        <Link to="/" className="text-steel/50 hover:text-gold transition-colors">Inicio</Link>
        <ChevronRight size={10} className="text-steel/30" />
        <Link to="/productos" className="text-steel/50 hover:text-gold transition-colors">Catálogo</Link>
        <ChevronRight size={10} className="text-steel/30" />
        <Link
          to={`/productos?category=${product.category}`}
          className="text-steel/50 hover:text-gold transition-colors"
        >
          {CATEGORY_LABELS[product.category]}
        </Link>
        <ChevronRight size={10} className="text-steel/30" />
        <span className="text-ash/60 truncate max-w-[120px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Images */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square bg-surface-mid overflow-hidden">
            <img
              src={product.images[selectedImage] ?? 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discount && (
              <div className="absolute top-3 left-3">
                <Badge variant="gold">-{discount}%</Badge>
              </div>
            )}
            {/* Technical frame */}
            <div className="absolute top-2 right-2 font-mono text-[8px] text-steel/20 uppercase tracking-widest">
              IMG_{String(selectedImage + 1).padStart(2, '0')}
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'w-16 h-16 overflow-hidden border transition-all duration-200',
                    selectedImage === i ? 'border-gold' : 'border-steel/20 hover:border-steel/50'
                  )}
                >
                  <img src={img} alt={`Vista ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          {/* Brand + Category */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="steel">{product.brand}</Badge>
            <Badge variant="outline">{CATEGORY_LABELS[product.category]}</Badge>
            {product.featured && <Badge variant="gold">Destacado</Badge>}
          </div>

          {/* Title */}
          <div>
            <h1 className="font-sans text-2xl md:text-3xl font-bold text-ash leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <StarRating rating={product.rating} size={14} />
              <span className="font-mono text-[10px] text-steel/50">
                {product.rating}/5 · {product.reviewCount} reseñas
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1">
            <PriceDisplay product={product} size="xl" />
            {discount && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-gold/60 mt-1">
                Ahorrás {formatCurrency(product.comparePrice! - product.price)}
              </p>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span className={cn(
              'w-1.5 h-1.5',
              product.stock > 10 ? 'bg-emerald-400' : product.stock > 0 ? 'bg-gold animate-pulse' : 'bg-red-400'
            )} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-steel">
              {product.stock > 10
                ? 'Stock disponible'
                : product.stock > 0
                ? `Últimas ${product.stock} unidades`
                : 'Sin stock'}
            </span>
          </div>

          <div className="h-px w-full bg-steel/15" />

          {/* Description */}
          <p className="font-sans text-sm text-ash/70 leading-relaxed">
            {product.description}
          </p>

          {/* Specs */}
          {Object.keys(product.specs).length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
                [ Especificaciones ]
              </p>
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 border-b border-steel/10 py-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-steel/60 w-24 flex-shrink-0">
                    {key}
                  </span>
                  <span className="font-mono text-[11px] text-ash">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="h-px w-full bg-steel/15" />

          {/* Quantity + Add to Cart */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel">Cantidad</p>
              <div className="flex items-center border border-steel/30">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center text-steel hover:text-gold hover:bg-surface-mid transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="w-10 text-center font-mono text-sm text-ash">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-9 h-9 flex items-center justify-center text-steel hover:text-gold hover:bg-surface-mid transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={cn(
                'w-full transition-all',
                added && 'bg-emerald-500 border-emerald-500 text-white shadow-none'
              )}
              icon={added ? <Check size={16} /> : <ShoppingCart size={16} />}
            >
              {added ? 'Agregado al carrito' : 'Agregar al carrito'}
            </Button>
          </div>

          {/* Calculador de envío */}
          <div className="border border-steel/15 bg-surface-mid p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-3 flex items-center gap-2">
              <Truck size={11} />
              Calcular envío
            </p>
            <ShippingCalculator
              cpOrigen={cpOrigen}
              pesoKg={pesoKg}
              valorDeclarado={product.price}
              dimensiones={dimensiones}
              contenido={product.name}
            />
          </div>

          {/* SKU */}
          <p className="font-mono text-[9px] text-steel/25 uppercase tracking-widest">
            SKU: PH-{product._id.slice(-6).toUpperCase()} /// {product.category.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Back link */}
      <Link
        to="/productos"
        className="mt-12 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-colors"
      >
        <ArrowLeft size={12} />
        Volver al catálogo
      </Link>
    </main>
  )
}
