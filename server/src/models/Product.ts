import { Schema, model } from 'mongoose'
import type { ProductCategory } from '../types'

export type ProductStatus = 'active' | 'pending_approval'
export type PendingAction = 'create' | 'update' | 'delete'

/**
 * Cambios propuestos pendientes de aprobación.
 * Solo se aplican cuando se clickea el link del mail al owner.
 */
interface IPendingChanges {
  name?: string
  description?: string
  cost?: number
  price?: number
  priceCash?: number
  comparePrice?: number
  category?: ProductCategory
  brand?: string
  stock?: number
  images?: string[]
  specs?: Map<string, string>
  featured?: boolean
  pesoEmbalado?: number
  alto?: number
  ancho?: number
  largo?: number
}

interface IProduct {
  // ── Display fields (lo que ven los clientes) ──
  name: string
  slug: string
  description: string
  price: number          // Precio con MP (con tarjeta). Auto-calculado desde cost.
  priceCash: number      // Precio en efectivo/transferencia. Auto-calculado desde cost.
  comparePrice?: number  // Precio tachado (opcional, para promos)
  images: string[]
  category: ProductCategory
  brand: string
  stock: number
  rating: number
  reviewCount: number
  tags: string[]
  specs: Map<string, string>
  featured: boolean

  // ── Dimensiones para cotización de envío ──
  pesoEmbalado?: number  // gramos
  alto?: number          // cm
  ancho?: number         // cm
  largo?: number         // cm

  // ── Pricing interno (admin only) ──
  cost: number           // Lo que el negocio pagó por el producto

  // ── Flujo de aprobación ──
  status: ProductStatus
  pendingAction?: PendingAction
  pendingChanges?: IPendingChanges
  approvalToken?: string      // SHA-256 del token (raw va al mail)
  approvalExpires?: Date

  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    priceCash: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    images: [{ type: String }],
    category: {
      type: String,
      required: true,
      enum: [
        'pcs-armadas',
        'procesadores',
        'placas-de-video',
        'memorias-ram',
        'almacenamiento',
        'placas-madre',
        'gabinetes',
        'refrigeracion',
        'fuentes',
        'monitores',
        'perifericos',
      ],
    },
    brand: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    tags: [{ type: String }],
    specs: { type: Map, of: String, default: {} },
    featured: { type: Boolean, default: false },

    pesoEmbalado: { type: Number, min: 0 },
    alto: { type: Number, min: 0 },
    ancho: { type: Number, min: 0 },
    largo: { type: Number, min: 0 },

    cost: { type: Number, required: true, min: 0, default: 0 },

    status: {
      type: String,
      enum: ['active', 'pending_approval'],
      default: 'active',
      index: true,
    },
    pendingAction: { type: String, enum: ['create', 'update', 'delete'] },
    pendingChanges: { type: Schema.Types.Mixed },
    approvalToken: { type: String, select: false, index: true },
    approvalExpires: { type: Date, select: false },
  },
  { timestamps: true }
)

productSchema.index({ name: 'text', brand: 'text', description: 'text' })
productSchema.index({ category: 1, price: 1 })
productSchema.index({ featured: 1 })

export const Product = model<IProduct>('Product', productSchema)
