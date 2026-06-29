import { Schema, model, Types } from 'mongoose'
import type { EstadoEnvio } from './shipping.types'

interface IShipment {
  orderId: Types.ObjectId
  shipmentId: number
  trackingNumber: string
  carrier: string
  service: string
  labelUrl: string
  estado: EstadoEnvio
  totalPrice: number
  currency: string
  creadoEn: Date
  actualizadoEn: Date
}

const shipmentSchema = new Schema<IShipment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    shipmentId: { type: Number, required: true },
    trackingNumber: { type: String, index: true },
    carrier: { type: String },
    service: { type: String },
    labelUrl: { type: String },
    estado: {
      type: String,
      enum: ['pending', 'in_transit', 'delivered', 'failed'],
      default: 'pending',
    },
    totalPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'ARS' },
  },
  {
    timestamps: { createdAt: 'creadoEn', updatedAt: 'actualizadoEn' },
  }
)

export const Shipment = model<IShipment>('Shipment', shipmentSchema)
