export interface ProductDimensions {
  heightCm: number
  widthCm: number
  depthCm: number
}

export interface Product {
  _id: string
  name: string
  slug: string
  description: string
  cost: number             // Admin-only: lo que se pagó por el producto
  price: number            // Precio final con Mercado Pago (auto-calc desde cost)
  priceCash: number        // Precio final en efectivo / transferencia (auto-calc)
  comparePrice?: number
  images: string[]
  category: ProductCategory
  brand: string
  stock: number
  rating: number
  reviewCount: number
  tags: string[]
  specs: Record<string, string>
  featured: boolean
  // Nombres del frontend (usados en el formulario)
  weightGrams?: number
  dimensions?: ProductDimensions
  // Nombres del servidor/modelo (pesoEmbalado, alto, ancho, largo)
  // El servidor puede devolver cualquiera de los dos
  pesoEmbalado?: number
  alto?: number
  ancho?: number
  largo?: number
  status?: 'active' | 'pending_approval'
  pendingAction?: 'create' | 'update' | 'delete'
  createdAt: string
}


export type ProductCategory =
  | 'pcs-armadas'
  | 'procesadores'
  | 'placas-de-video'
  | 'memorias-ram'
  | 'almacenamiento'
  | 'placas-madre'
  | 'gabinetes'
  | 'refrigeracion'
  | 'fuentes'
  | 'monitores'
  | 'perifericos'

export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

export interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  emailVerified: boolean
  createdAt: string
}

export type PaymentMethod = 'mercadopago' | 'transferencia'

export type InvoiceType = 'A' | 'B' | 'C'

export type TaxCategory =
  | 'consumidor_final'
  | 'monotributo'
  | 'responsable_inscripto'
  | 'exento'

export interface ShippingExtra {
  apartment?: string
  phone?: string
  deliveryNotes?: string
}

export interface BillingInfo {
  invoiceType: InvoiceType
  name: string
  taxId: string
  taxCategory: TaxCategory
  billingAddress: Address
}

export interface BankInfo {
  holder: string
  cbu: string
  alias: string
  bankName: string
}

export interface TransferProof {
  transferDate?: string         // ISO date string (opcional si solo subió imagen)
  amount?: number
  fromBank?: string
  reference?: string
  notes?: string
  receiptImageUrl?: string
  submittedAt: string
}

export interface Order {
  _id: string
  user: string
  items: OrderItem[]
  total: number
  shippingCost?: number
  status: OrderStatus
  paymentMethod?: PaymentMethod
  shippingAddress: Address
  shippingExtra?: ShippingExtra
  billingInfo?: BillingInfo
  transferProof?: TransferProof
  bankInfo?: BankInfo  // Solo incluido cuando es transferencia+pending sin proof
  // Campos de envío (envia.com)
  shipmentId?: number
  trackingNumber?: string
  labelUrl?: string
  shippingService?: string
  createdAt: string
}

export interface OrderItem {
  product: string
  name: string
  price: number
  quantity: number
  image: string
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface ApiError {
  message: string
  status: number
}

export interface ProductFilters {
  // ── Filtros simples (legado) ──────────────────────────────
  category?: ProductCategory
  brand?: string
  // ── Filtros avanzados ─────────────────────────────────────
  categories?: ProductCategory[]   // múltiples categorías
  brands?: string[]                // múltiples marcas
  inStock?: boolean                // solo con stock > 0
  featured?: boolean               // solo destacados
  // ── Precio / búsqueda / orden ─────────────────────────────
  minPrice?: number
  maxPrice?: number
  search?: string
  sort?: ProductSort
  page?: number
  limit?: number
}

export type ProductSort =
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'rating'
  | 'name-asc'
