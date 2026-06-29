import { useEffect, useState } from 'react'
import { Search, Plus, Edit2, Trash2, Package, Clock } from 'lucide-react'
import { Button, Input, Badge } from '@/components/ui'
import { ProductFormModal } from './ProductFormModal'
import { getProductsForAdmin } from '@/services/admin'
import { deleteProduct } from '@/services/admin'
import { formatCurrency, cn, CATEGORY_LABELS } from '@/utils'
import type { Product } from '@/types'

const PENDING_LABEL: Record<NonNullable<Product['pendingAction']>, string> = {
  create: 'Pendiente creación',
  update: 'Pendiente edición',
  delete: 'Pendiente eliminación',
}

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      // Endpoint admin trae también productos en pending
      const res = await getProductsForAdmin({ limit: 48, search: search || undefined })
      setProducts(res.data)
    } catch {
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(loadProducts, 250)
    return () => clearTimeout(debounce)
  }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto permanentemente?')) return
    setDeletingId(id)
    try {
      await deleteProduct(id)
      setProducts((p) => p.filter((x) => x._id !== id))
    } catch {
      alert('Error al eliminar el producto')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaved = (saved: Product, isNew: boolean) => {
    setProducts((prev) =>
      isNew ? [saved, ...prev] : prev.map((p) => (p._id === saved._id ? saved : p))
    )
    setEditingProduct(null)
    setIsCreating(false)
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
            [ Admin / Productos ]
          </p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] uppercase tracking-tightest text-ash">
            Catálogo
          </h1>
        </div>
        <Button size="md" icon={<Plus size={14} />} onClick={() => setIsCreating(true)}>
          Nuevo producto
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="Buscar por nombre o marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={14} />}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="grid gap-px bg-steel/10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-mid animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="border border-steel/15 bg-surface-mid p-12 text-center">
          <Package size={32} className="text-steel/30 mx-auto mb-3" />
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel/50">
            {search ? 'Sin resultados' : 'No hay productos todavía'}
          </p>
        </div>
      ) : (
        <div className="grid gap-px bg-steel/10">
          {products.map((p) => (
            <div
              key={p._id}
              className="flex items-center gap-4 bg-surface-mid p-4 group"
            >
              <div className="w-14 h-14 bg-surface-dark overflow-hidden flex-shrink-0">
                {p.images[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={18} className="text-steel/30" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-steel">{p.brand}</p>
                  <Badge variant="outline">{CATEGORY_LABELS[p.category] ?? p.category}</Badge>
                  {p.featured && <Badge variant="gold">Destacado</Badge>}
                  {p.pendingAction && (
                    <Badge variant="gold" className="gap-1">
                      <Clock size={9} />
                      {PENDING_LABEL[p.pendingAction]}
                    </Badge>
                  )}
                  {p.status === 'pending_approval' && p.pendingAction === 'create' && (
                    <Badge variant="steel">No visible en la tienda</Badge>
                  )}
                </div>
                <p className="font-sans text-sm text-ash truncate mt-0.5">{p.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-steel/40 mt-0.5">
                  Slug: {p.slug}
                </p>
              </div>

              {/* Stock */}
              <div className="hidden md:flex flex-col items-end min-w-[80px]">
                <span className={cn(
                  'font-mono text-sm',
                  p.stock === 0 ? 'text-red-400' : p.stock < 5 ? 'text-gold' : 'text-ash'
                )}>
                  {p.stock}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-steel/40">stock</span>
              </div>

              {/* Price */}
              <div className="text-right min-w-[100px]">
                <p className="font-mono text-base text-gold">{formatCurrency(p.price)}</p>
                {p.comparePrice && (
                  <p className="font-mono text-[10px] text-steel/40 line-through">
                    {formatCurrency(p.comparePrice)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingProduct(p)}
                  disabled={!!p.pendingAction}
                  title={p.pendingAction ? 'Hay un cambio pendiente, aprobalo primero' : 'Editar'}
                  className="p-2 text-steel hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Editar"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  disabled={deletingId === p._id || !!p.pendingAction}
                  title={p.pendingAction ? 'Hay un cambio pendiente, aprobalo primero' : 'Eliminar'}
                  className="p-2 text-steel hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación/edición */}
      {(isCreating || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setIsCreating(false)
            setEditingProduct(null)
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
