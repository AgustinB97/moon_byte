import { useState } from 'react'
import { X, Plus, Trash2, Save, Mail, Package } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { PriceCalculator } from '@/components/admin/PriceCalculator'
import { createProduct, updateProduct } from '@/services/admin'
import { slugify, CATEGORY_LABELS } from '@/utils'
import type { Product, ProductCategory } from '@/types'

interface ProductFormModalProps {
  product: Product | null
  onClose: () => void
  onSaved: (product: Product, isNew: boolean) => void
}

interface FormState {
  name: string
  slug: string
  description: string
  cost: string
  comparePrice: string
  category: ProductCategory
  brand: string
  stock: string
  featured: boolean
  images: string[]
  specs: { key: string; value: string }[]
  weightGrams: string
  heightCm: string
  widthCm: string
  depthCm: string
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[]

// El servidor puede devolver pesoEmbalado/alto/ancho/largo o weightGrams/dimensions.*
// Product ya incluye ambas convenciones en types/index.ts
function productToForm(p: Product | null): FormState {
  const peso = p?.weightGrams ?? p?.pesoEmbalado
  const alto = p?.dimensions?.heightCm ?? p?.alto
  const ancho = p?.dimensions?.widthCm  ?? p?.ancho
  const largo = p?.dimensions?.depthCm  ?? p?.largo

  return {
    name: p?.name ?? '',
    slug: p?.slug ?? '',
    description: p?.description ?? '',
    cost: p?.cost ? String(p.cost) : '',
    comparePrice: p?.comparePrice ? String(p.comparePrice) : '',
    category: p?.category ?? 'pcs-armadas',
    brand: p?.brand ?? '',
    stock: p?.stock !== undefined ? String(p.stock) : '0',
    featured: p?.featured ?? false,
    images: p?.images ?? [],
    specs: p?.specs ? Object.entries(p.specs).map(([key, value]) => ({ key, value })) : [],
    weightGrams: peso  ? String(peso)  : '',
    heightCm:    alto  ? String(alto)  : '',
    widthCm:     ancho ? String(ancho) : '',
    depthCm:     largo ? String(largo) : '',
  }
}

export function ProductFormModal({ product, onClose, onSaved }: ProductFormModalProps) {
  const isNew = !product
  const [form, setForm] = useState<FormState>(productToForm(product))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null)
  // Guardamos el resultado para llamar a onSaved cuando el user cierre la pantalla
  // de éxito. Si lo llamáramos al instante, el padre desmonta el modal y se
  // pierde la pantalla de "esperando aprobación".
  const [savedData, setSavedData] = useState<{ product: Product; isNew: boolean } | null>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: isNew && (!f.slug || f.slug === slugify(f.name)) ? slugify(name) : f.slug,
    }))
  }

  const addSpec = () => setForm((f) => ({ ...f, specs: [...f.specs, { key: '', value: '' }] }))
  const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
    setForm((f) => ({
      ...f,
      specs: f.specs.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }))
  }
  const removeSpec = (index: number) => {
    setForm((f) => ({ ...f, specs: f.specs.filter((_, i) => i !== index) }))
  }

  const handleSave = async () => {
    setError('')
    if (!form.name.trim() || !form.slug.trim() || !form.cost || !form.brand.trim()) {
      setError('Nombre, slug, costo y marca son obligatorios')
      return
    }
    const costNum = Number(form.cost)
    if (!Number.isFinite(costNum) || costNum < 0) {
      setError('El costo debe ser un número positivo')
      return
    }

    // Validar dimensiones/peso (solo si se ingresó algún valor)
    if (form.weightGrams) {
      const w = Number(form.weightGrams)
      if (!Number.isFinite(w) || w <= 0 || !Number.isInteger(w)) {
        setError('El peso debe ser un número entero positivo (gramos)')
        return
      }
    }
    for (const [label, val] of [['alto', form.heightCm], ['ancho', form.widthCm], ['largo', form.depthCm]] as const) {
      if (val) {
        const n = Number(val)
        if (!Number.isFinite(n) || n <= 0) {
          setError(`La dimensión "${label}" debe ser un número positivo`)
          return
        }
      }
    }

    const payload: Partial<Product> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      cost: costNum,
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      category: form.category,
      brand: form.brand.trim(),
      stock: Number(form.stock),
      featured: form.featured,
      images: form.images,
      specs: Object.fromEntries(
        form.specs.filter((s) => s.key.trim() && s.value.trim()).map((s) => [s.key.trim(), s.value.trim()])
      ),
      weightGrams: form.weightGrams ? Number(form.weightGrams) : undefined,
      dimensions: (form.heightCm || form.widthCm || form.depthCm) ? {
        heightCm: form.heightCm ? Number(form.heightCm) : 0,
        widthCm: form.widthCm ? Number(form.widthCm) : 0,
        depthCm: form.depthCm ? Number(form.depthCm) : 0,
      } : undefined,
    }

    setIsSaving(true)
    try {
      const saved = isNew
        ? await createProduct(payload)
        : await updateProduct(product!._id, payload)

      // Guardar para llamarlo cuando el user haga click en "Cerrar"
      setSavedData({ product: saved, isNew })
      setSubmittedMessage(
        isNew
          ? `El producto fue creado en estado pending. Llegará un mail a la cuenta del owner para confirmar la creación.`
          : `Los cambios fueron guardados en pending. Llegará un mail al owner para aprobar la modificación. Mientras tanto, los clientes siguen viendo el producto con los valores anteriores.`
      )
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  // Pantalla de éxito (post-save, esperando aprobación)
  if (submittedMessage) {
    const handleCloseSuccess = () => {
      // Notificar al padre AHORA (no al guardar) → actualiza el listado
      // y al mismo tiempo desmonta el modal
      if (savedData) {
        onSaved(savedData.product, savedData.isNew)
      } else {
        onClose()
      }
    }

    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-surface-mid border border-gold/40 w-full max-w-md p-6 text-center animate-reveal">
          <Mail size={32} className="text-gold mx-auto mb-4" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-2">
            [ Esperando aprobación ]
          </p>
          <h3 className="font-display text-2xl uppercase tracking-tightest text-ash mb-4">
            Mail enviado
          </h3>
          <p className="font-mono text-[11px] text-steel uppercase tracking-wide leading-relaxed mb-6">
            {submittedMessage}
          </p>
          <Button size="md" className="w-full" onClick={handleCloseSuccess}>
            Cerrar
          </Button>
        </div>
      </div>
    )
  }

  const costNum = Number(form.cost) || 0

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-surface-mid border border-steel/20 w-full max-w-3xl my-8 animate-reveal">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-steel/15">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel">
              [ {isNew ? 'Nuevo' : 'Editar'} ]
            </p>
            <h2 className="font-display text-2xl uppercase tracking-tightest text-ash">
              {isNew ? 'Crear producto' : form.name || 'Editar producto'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-steel hover:text-ash transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Aviso del flujo de aprobación */}
        <div className="mx-5 mt-4 border border-gold/30 bg-gold/5 px-4 py-3 flex items-start gap-2">
          <Mail size={13} className="text-gold mt-0.5 flex-shrink-0" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-gold/90 leading-relaxed">
            Al guardar se envía un mail de aprobación al owner. El cambio se aplica solo al confirmar el link.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Nombre"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="MoonByte Vega — PC Gamer RTX 4070"
            />
          </div>

          <Input
            label="Slug (URL)"
            value={form.slug}
            onChange={(e) => update('slug', e.target.value)}
            placeholder="moonbyte-vega-rtx4070"
          />

          <Input
            label="Marca"
            value={form.brand}
            onChange={(e) => update('brand', e.target.value)}
            placeholder="MoonByte / AMD / NVIDIA"
          />

          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-steel block mb-1.5">
              Categoría
            </label>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value as ProductCategory)}
              className="w-full bg-surface-dark border border-steel/30 text-ash font-mono text-sm px-4 py-3 focus:outline-none focus:border-gold/60 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>

          <Input
            label="Stock"
            type="number"
            value={form.stock}
            onChange={(e) => update('stock', e.target.value)}
          />

          {/* Costo + calculadora live */}
          <div className="md:col-span-2 border border-gold/20 bg-surface-dark/40 p-4">
            <Input
              label="Costo (lo que pagaste por el producto)"
              type="number"
              value={form.cost}
              onChange={(e) => update('cost', e.target.value)}
              placeholder="ej: 1361000"
              icon={<span className="font-mono text-xs text-steel">$</span>}
            />
            <div className="mt-3">
              <PriceCalculator cost={costNum} />
            </div>
          </div>

          <div className="md:col-span-2">
            <Input
              label="Precio comparativo (tachado, opcional)"
              type="number"
              value={form.comparePrice}
              onChange={(e) => update('comparePrice', e.target.value)}
              placeholder="Solo si querés mostrar un precio anterior tachado"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-steel block mb-1.5">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="w-full bg-surface-dark border border-steel/30 text-ash font-mono text-sm px-4 py-3 focus:outline-none focus:border-gold/60 transition-colors resize-y"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
              className="w-4 h-4 accent-gold"
            />
            <label
              htmlFor="featured"
              className="font-mono text-[11px] uppercase tracking-widest text-ash cursor-pointer"
            >
              Producto destacado (aparece en home)
            </label>
          </div>

          {/* Images */}
          <div className="md:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
              [ Imágenes ({form.images.length}) ]
            </p>
            <ImageUploader
              images={form.images}
              onChange={(images) => update('images', images)}
            />
          </div>

          {/* Specs */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel">
                [ Especificaciones ({form.specs.length}) ]
              </p>
              <button
                onClick={addSpec}
                className="font-mono text-[10px] uppercase tracking-widest text-gold hover:text-gold-light flex items-center gap-1"
              >
                <Plus size={11} /> Agregar
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {form.specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="CPU"
                    value={s.key}
                    onChange={(e) => updateSpec(i, 'key', e.target.value)}
                    className="w-1/3 bg-surface-dark border border-steel/30 text-ash font-mono text-xs px-3 py-2 focus:outline-none focus:border-gold/60"
                  />
                  <input
                    placeholder="Ryzen 7 7700X"
                    value={s.value}
                    onChange={(e) => updateSpec(i, 'value', e.target.value)}
                    className="flex-1 bg-surface-dark border border-steel/30 text-ash font-mono text-xs px-3 py-2 focus:outline-none focus:border-gold/60"
                  />
                  <button onClick={() => removeSpec(i)} className="p-2 text-steel hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Embalaje / dimensiones */}
          <div className="md:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2 flex items-center gap-1.5">
              <Package size={11} />
              [ Embalaje (para cotizar flete) ]
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Input
                label="Peso embalado (g)"
                type="number"
                value={form.weightGrams}
                onChange={(e) => update('weightGrams', e.target.value)}
                placeholder="1500"
              />
              <Input
                label="Alto (cm)"
                type="number"
                value={form.heightCm}
                onChange={(e) => update('heightCm', e.target.value)}
                placeholder="30"
              />
              <Input
                label="Ancho (cm)"
                type="number"
                value={form.widthCm}
                onChange={(e) => update('widthCm', e.target.value)}
                placeholder="25"
              />
              <Input
                label="Largo (cm)"
                type="number"
                value={form.depthCm}
                onChange={(e) => update('depthCm', e.target.value)}
                placeholder="40"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-steel/15 flex flex-col gap-3">
          {error && (
            <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest border border-red-500/20 px-3 py-2">
              [ Error ] {error}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              size="md"
              loading={isSaving}
              onClick={handleSave}
              icon={<Save size={13} />}
            >
              {isNew ? 'Enviar para aprobación' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
