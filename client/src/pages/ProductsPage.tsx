import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Meta } from '@/components/seo/Meta'
import { ProductCard } from '@/components/features/ProductCard'
import { ProductFilters } from '@/components/features/ProductFilters'
import { Button, Badge } from '@/components/ui'
import { getProducts } from '@/services/products'
import { cn, CATEGORY_LABELS, formatCurrency } from '@/utils'
import type { Product, ProductFilters as Filters, ProductSort } from '@/types'

const SORT_LABELS: Record<ProductSort, string> = {
  newest: 'Más nuevos',
  'price-asc': 'Menor precio',
  'price-desc': 'Mayor precio',
  rating: 'Mejor calificados',
  'name-asc': 'A-Z',
}

const PAGE_SIZE = 12

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const filters: Filters = {
    // Multi-valor
    categories: searchParams.get('categories')?.split(',').filter(Boolean) as Filters['categories'] ?? undefined,
    brands:     searchParams.get('brands')?.split(',').filter(Boolean) ?? undefined,
    inStock:    searchParams.get('inStock') === 'true' ? true : undefined,
    featured:   searchParams.get('featured') === 'true' ? true : undefined,
    // Legado singular (para compatibilidad con links externos)
    category:   (searchParams.get('category') as Filters['category']) ?? undefined,
    brand:      searchParams.get('brand') ?? undefined,
    // Precio / búsqueda / orden — sort default price-desc
    search:     searchParams.get('search') ?? undefined,
    sort:       (searchParams.get('sort') as ProductSort) ?? 'price-desc',
    minPrice:   searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice:   searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    page:       Number(searchParams.get('page') ?? 1),
    limit:      PAGE_SIZE,
  }

  const updateFilters = useCallback((updates: Partial<Filters>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          next.delete(key)
        } else if (Array.isArray(value)) {
          next.set(key, value.join(','))
        } else {
          next.set(key, String(value))
        }
      })
      if (!('page' in updates)) next.delete('page')
      return next
    })
  }, [setSearchParams])

  useEffect(() => {
    setIsLoading(true)
    getProducts(filters)
      .then((res) => {
        setProducts(res.data)
        setTotal(res.total)
      })
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false))
  }, [searchParams.toString()])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = filters.page ?? 1

  const activeFilterCount = [
    ...(filters.categories ?? []),
    ...(filters.brands ?? []),
    filters.category,
    filters.brand,
    filters.inStock,
    filters.featured,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length

  return (
    <main className="max-w-7xl mx-auto px-4 pt-24 pb-16">
      <Meta
        title={filters.category ? CATEGORY_LABELS[filters.category] : filters.search ? `Búsqueda: "${filters.search}"` : 'Catálogo'}
        description="Explorá nuestro catálogo de hardware: PCs armadas, procesadores, placas de video, memorias y más."
        canonical="/productos"
      />
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
          [ Catálogo ]
        </p>
        <h1 className="font-display text-[clamp(2rem,6vw,5rem)] uppercase tracking-tightest text-ash">
          {filters.category
            ? CATEGORY_LABELS[filters.category]
            : filters.search
            ? `"${filters.search}"`
            : 'Todos los Productos'}
        </h1>
        {total > 0 && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel mt-1">
            {total} {total === 1 ? 'resultado' : 'resultados'}
          </p>
        )}
      </div>

      <div className="flex gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-24">
            <ProductFilters filters={filters} onChange={updateFilters} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {/* Mobile filter button */}
            <button
              onClick={() => setFiltersOpen(true)}
              className="md:hidden flex items-center gap-2 border border-steel/30 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-steel hover:border-gold hover:text-gold transition-colors"
            >
              <SlidersHorizontal size={12} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-gold text-surface-dark font-bold text-[8px] w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Active filter chips */}
            {(filters.categories ?? []).map((cat) => (
              <Badge key={cat} variant="gold" className="gap-1">
                {CATEGORY_LABELS[cat]}
                <button
                  onClick={() => updateFilters({ categories: filters.categories?.filter((c) => c !== cat) })}
                  aria-label={`Quitar ${CATEGORY_LABELS[cat]}`}
                ><X size={9} /></button>
              </Badge>
            ))}
            {filters.category && !filters.categories?.length && (
              <Badge variant="gold" className="gap-1">
                {CATEGORY_LABELS[filters.category]}
                <button onClick={() => updateFilters({ category: undefined })}><X size={9} /></button>
              </Badge>
            )}
            {(filters.brands ?? []).map((b) => (
              <Badge key={b} variant="steel" className="gap-1">
                {b}
                <button
                  onClick={() => updateFilters({ brands: filters.brands?.filter((x) => x !== b) })}
                  aria-label={`Quitar ${b}`}
                ><X size={9} /></button>
              </Badge>
            ))}
            {filters.brand && !filters.brands?.length && (
              <Badge variant="steel" className="gap-1">
                {filters.brand}
                <button onClick={() => updateFilters({ brand: undefined })}><X size={9} /></button>
              </Badge>
            )}
            {filters.inStock && (
              <Badge variant="steel" className="gap-1">
                Con stock
                <button onClick={() => updateFilters({ inStock: undefined })}><X size={9} /></button>
              </Badge>
            )}
            {filters.featured && (
              <Badge variant="gold" className="gap-1">
                Destacados
                <button onClick={() => updateFilters({ featured: undefined })}><X size={9} /></button>
              </Badge>
            )}
            {filters.search && (
              <Badge variant="steel" className="gap-1">
                <Search size={9} />
                {filters.search}
                <button onClick={() => updateFilters({ search: undefined })} aria-label="Quitar búsqueda">
                  <X size={9} />
                </button>
              </Badge>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <Badge variant="steel" className="gap-1">
                {filters.minPrice ? formatCurrency(filters.minPrice) : '$0'}
                {' — '}
                {filters.maxPrice ? formatCurrency(filters.maxPrice) : '∞'}
                <button
                  onClick={() => updateFilters({ minPrice: undefined, maxPrice: undefined })}
                  aria-label="Quitar rango de precio"
                >
                  <X size={9} />
                </button>
              </Badge>
            )}
            {activeFilterCount > 0 && (
              <button
                onClick={() => setSearchParams({})}
                className="font-mono text-[9px] uppercase tracking-widest text-steel/50 hover:text-gold transition-colors ml-1"
              >
                Limpiar todo
              </button>
            )}

            {/* Sort (desktop) */}
            <div className="hidden md:block ml-auto relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 border border-steel/30 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-steel hover:border-gold hover:text-gold transition-colors"
              >
                {SORT_LABELS[filters.sort ?? 'newest']}
                <ChevronDown size={10} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 bg-surface-dark border border-steel/30 z-20 min-w-[160px]">
                  {(Object.keys(SORT_LABELS) as ProductSort[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { updateFilters({ sort: opt }); setSortOpen(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors',
                        filters.sort === opt
                          ? 'text-gold bg-gold/10'
                          : 'text-steel hover:text-ash hover:bg-surface-mid'
                      )}
                    >
                      {SORT_LABELS[opt]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-steel/10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-surface-mid animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-steel/10">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} className="h-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel/50">
                Sin resultados para esta búsqueda
              </p>
              <Button variant="outline" size="sm" onClick={() => setSearchParams({})}>
                Limpiar filtros
              </Button>
            </div>
          )}

          {/* Paginación */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => updateFilters({ page: currentPage - 1 })}
                disabled={currentPage <= 1}
                className="p-2 border border-steel/20 text-steel hover:border-gold hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="font-mono text-[10px] text-steel/40 px-1">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => updateFilters({ page: p as number })}
                      className={cn(
                        'w-8 h-8 font-mono text-[10px] border transition-colors',
                        currentPage === p
                          ? 'bg-gold text-surface-dark border-gold'
                          : 'border-steel/20 text-steel hover:border-gold hover:text-gold'
                      )}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => updateFilters({ page: currentPage + 1 })}
                disabled={currentPage >= totalPages}
                className="p-2 border border-steel/20 text-steel hover:border-gold hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Página siguiente"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/70 md:hidden transition-opacity duration-300',
          filtersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setFiltersOpen(false)}
      />
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 w-72 bg-surface-dark border-r border-steel/20 p-6 overflow-y-auto md:hidden',
          'transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
          filtersOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel">[ Filtros ]</p>
          <button onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros">
            <X size={16} className="text-steel" />
          </button>
        </div>
        <ProductFilters
          filters={filters}
          onChange={(f) => { updateFilters(f); setFiltersOpen(false) }}
        />
      </aside>
    </main>
  )
}
