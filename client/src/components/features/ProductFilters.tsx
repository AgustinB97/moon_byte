import { useState, KeyboardEvent } from 'react'
import { ChevronDown, X, Plus } from 'lucide-react'
import type { ProductFilters as Filters, ProductCategory, ProductSort } from '@/types'
import { CATEGORY_LABELS, cn } from '@/utils'

interface ProductFiltersProps {
  filters: Filters
  onChange: (filters: Partial<Filters>) => void
}

const ALL_CATEGORIES: ProductCategory[] = [
  'pcs-armadas', 'procesadores', 'placas-de-video', 'memorias-ram',
  'almacenamiento', 'placas-madre', 'gabinetes', 'refrigeracion',
  'fuentes', 'monitores', 'perifericos',
]

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'price-asc',  label: 'Menor precio' },
  { value: 'newest',     label: 'Más nuevos' },
  { value: 'rating',     label: 'Mejor calificados' },
  { value: 'name-asc',   label: 'A-Z' },
]

// ── Sub-componente: sección colapsable ───────────────────────
function FilterSection({ title, children, defaultOpen = true }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-steel/10 pb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel group-hover:text-ash transition-colors">
          [ {title} ]
        </p>
        <ChevronDown
          size={11}
          className={cn('text-steel/50 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && children}
    </div>
  )
}

export function ProductFilters({ filters, onChange }: ProductFiltersProps) {
  const [brandInput, setBrandInput] = useState('')

  const selectedCategories = filters.categories ?? (filters.category ? [filters.category] : [])
  const selectedBrands     = filters.brands ?? (filters.brand ? [filters.brand] : [])

  // ── Categorías ───────────────────────────────────────────
  const toggleCategory = (cat: ProductCategory) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat]
    onChange({ categories: next.length ? next : undefined, category: undefined })
  }

  // ── Marcas ───────────────────────────────────────────────
  const addBrand = () => {
    const trimmed = brandInput.trim()
    if (!trimmed || selectedBrands.includes(trimmed)) return
    onChange({ brands: [...selectedBrands, trimmed], brand: undefined })
    setBrandInput('')
  }

  const removeBrand = (b: string) => {
    const next = selectedBrands.filter((x) => x !== b)
    onChange({ brands: next.length ? next : undefined, brand: undefined })
  }

  const handleBrandKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addBrand() }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Categorías */}
      <FilterSection title="Categoría">
        <div className="flex flex-col gap-0.5">
          {ALL_CATEGORIES.map((cat) => {
            const checked = selectedCategories.includes(cat)
            return (
              <label
                key={cat}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-1.5 cursor-pointer border-l-2 transition-all',
                  checked
                    ? 'border-gold text-gold bg-gold/10'
                    : 'border-transparent text-ash/50 hover:text-ash hover:bg-surface-mid'
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(cat)}
                  className="w-3 h-3 accent-gold"
                />
                <span className="font-mono text-[11px] uppercase tracking-wide">
                  {CATEGORY_LABELS[cat]}
                </span>
              </label>
            )
          })}
        </div>
        {selectedCategories.length > 0 && (
          <button
            onClick={() => onChange({ categories: undefined, category: undefined })}
            className="mt-2 font-mono text-[9px] uppercase tracking-widest text-steel/50 hover:text-gold transition-colors"
          >
            Limpiar categorías
          </button>
        )}
      </FilterSection>

      {/* Marcas */}
      <FilterSection title="Marca">
        {selectedBrands.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedBrands.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest border border-steel/30 bg-surface-dark px-2 py-1 text-ash"
              >
                {b}
                <button onClick={() => removeBrand(b)} className="text-steel hover:text-red-400 transition-colors">
                  <X size={9} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={brandInput}
            onChange={(e) => setBrandInput(e.target.value)}
            onKeyDown={handleBrandKey}
            placeholder="AMD, Intel, NVIDIA…"
            className="flex-1 bg-surface-dark border border-steel/20 text-ash font-mono text-[11px] px-3 py-2 focus:outline-none focus:border-gold/40 transition-colors"
          />
          <button
            onClick={addBrand}
            disabled={!brandInput.trim()}
            className="px-2.5 border border-steel/20 text-steel hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-30"
            aria-label="Agregar marca"
          >
            <Plus size={12} />
          </button>
        </div>
        <p className="font-mono text-[9px] text-steel/40 mt-1.5">
          Enter o + para agregar
        </p>
      </FilterSection>

      {/* Toggles */}
      <FilterSection title="Disponibilidad" defaultOpen={true}>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => onChange({ inStock: filters.inStock ? undefined : true })}
              className={cn(
                'w-9 h-5 rounded-full transition-colors relative flex-shrink-0',
                filters.inStock ? 'bg-gold' : 'bg-steel/20'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                filters.inStock && 'translate-x-4'
              )} />
            </div>
            <span className={cn(
              'font-mono text-[11px] uppercase tracking-wide transition-colors',
              filters.inStock ? 'text-gold' : 'text-ash/60 group-hover:text-ash'
            )}>
              Solo con stock
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => onChange({ featured: filters.featured ? undefined : true })}
              className={cn(
                'w-9 h-5 rounded-full transition-colors relative flex-shrink-0',
                filters.featured ? 'bg-gold' : 'bg-steel/20'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                filters.featured && 'translate-x-4'
              )} />
            </div>
            <span className={cn(
              'font-mono text-[11px] uppercase tracking-wide transition-colors',
              filters.featured ? 'text-gold' : 'text-ash/60 group-hover:text-ash'
            )}>
              Solo destacados
            </span>
          </label>
        </div>
      </FilterSection>

      {/* Precio */}
      <FilterSection title="Precio">
        <div className="flex flex-col gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-steel">$</span>
            <input
              type="number"
              placeholder="Mínimo"
              value={filters.minPrice ?? ''}
              onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full bg-surface-dark border border-steel/20 text-ash font-mono text-[11px] pl-7 pr-3 py-2.5 focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-steel">$</span>
            <input
              type="number"
              placeholder="Máximo"
              value={filters.maxPrice ?? ''}
              onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full bg-surface-dark border border-steel/20 text-ash font-mono text-[11px] pl-7 pr-3 py-2.5 focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>
        </div>
      </FilterSection>

      {/* Ordenar — mobile only */}
      <FilterSection title="Ordenar">
        <div className="relative">
          <select
            value={filters.sort ?? 'price-desc'}
            onChange={(e) => onChange({ sort: e.target.value as ProductSort })}
            className="w-full appearance-none bg-surface-dark border border-steel/20 text-ash font-mono text-[11px] px-3 py-2.5 focus:outline-none focus:border-gold/40 transition-colors"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-steel pointer-events-none" />
        </div>
      </FilterSection>

    </div>
  )
}
