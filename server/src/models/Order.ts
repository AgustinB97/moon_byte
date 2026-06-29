import { Schema, model, Types } from 'mongoose'
import type { OrderStatus } from '../types'

export type PaymentMethod = 'mercadopago' | 'transferencia'

export type InvoiceType = 'A' | 'B' | 'C'

export type TaxCategory =
  | 'consumidor_final'
  | 'monotributo'
  | 'responsable_inscripto'
  | 'exento'

interface IOrderItem {
  product: Types.ObjectId
  name: string
  price: number
  quantity: number
  image: string
}

interface IAddress {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface IShippingExtra {
  apartment?: string
  phone?: string
  deliveryNotes?: string
}

interface IBillingInfo {
  invoiceType: InvoiceType
  name: string              // Razón social o nombre completo
  taxId: string             // CUIT o DNI
  taxCategory: TaxCategory
  billingAddress: IAddress  // Domicilio fiscal (separado del de envío)
}

interface ITransferProof {
  // Modo "datos manuales" (opcionales si subió comprobante)
  transferDate?: Date
  amount?: number
  fromBank?: string
  reference?: string         // Nº de operación del banco
  notes?: string
  // Modo "imagen del comprobante" (opcional si cargó datos manuales)
  receiptImageUrl?: string
  // Siempre presente cuando se guarda
  submittedAt: Date
}

interface IOrder {
  user: Types.ObjectId
  items: IOrderItem[]
  total: number
  shippingCost: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  shippingAddress: IAddress
  shippingExtra?: IShippingExtra
  billingInfo: IBillingInfo
  transferProof?: ITransferProof  // Solo presente si paymentMethod=transferencia y user lo subió

  // ── Envío (Envia.com) ──
  shippingService?: string       // Código del servicio seleccionado en cotización
  shipmentId?: number            // ID del envío en Envia.com
  trackingNumber?: string        // Número de seguimiento
  labelUrl?: string              // URL del PDF de la etiqueta

  // ── Cancelación pendiente de confirmación ──
  cancelShipmentToken?: string   // Hash del token (raw va en el email)
  cancelShipmentExpires?: Date

  createdAt: Date
}

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'Argentina', trim: true },
  },
  { _id: false }
)

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String },
      },
    ],
    total: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['mercadopago', 'transferencia'],
      required: true,
    },
    shippingAddress: { type: addressSchema, required: true },
    shippingExtra: {
      apartment: { type: String, trim: true },
      phone: { type: String, trim: true },
      deliveryNotes: { type: String, trim: true, maxlength: 500 },
    },
    billingInfo: {
      invoiceType: { type: String, enum: ['A', 'B', 'C'], required: true },
      name: { type: String, required: true, trim: true, maxlength: 120 },
      taxId: { type: String, required: true, trim: true, maxlength: 20 },
      taxCategory: {
        type: String,
        enum: ['consumidor_final', 'monotributo', 'responsable_inscripto', 'exento'],
        required: true,
      },
      billingAddress: { type: addressSchema, required: true },
    },
    shippingService: { type: String, trim: true },
    shipmentId: { type: Number },
    trackingNumber: { type: String, trim: true, index: true },
    labelUrl: { type: String, trim: true },
    cancelShipmentToken: { type: String, select: false },
    cancelShipmentExpires: { type: Date },

    transferProof: {
      transferDate: { type: Date },
      amount: { type: Number, min: 0 },
      fromBank: { type: String, trim: true, maxlength: 80 },
      reference: { type: String, trim: true, maxlength: 80 },
      notes: { type: String, trim: true, maxlength: 500 },
      receiptImageUrl: { type: String, trim: true },
      submittedAt: { type: Date },
    },
  },
  { timestamps: true }
)

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ status: 1 })
orderSchema.index({ paymentMethod: 1 })

export const Order = model<IOrder>('Order', orderSchema)
