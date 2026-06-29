import api from './api'
import type {
  Order,
  Address,
  BankInfo,
  BillingInfo,
  PaymentMethod,
  ShippingExtra,
} from '@/types'

interface CheckoutPayload {
  items: { product: string; quantity: number }[]
  paymentMethod: PaymentMethod
  shippingAddress: Address
  shippingExtra?: ShippingExtra
  billingInfo: BillingInfo
  shippingCost?: number
}

export interface CheckoutResponseMP {
  orderId: string
  paymentMethod: 'mercadopago'
  preferenceId: string
  initPoint: string
  isMock: boolean
}

export interface CheckoutResponseTransfer {
  orderId: string
  paymentMethod: 'transferencia'
  total: number
  bankInfo: BankInfo
  message: string
}

export type CheckoutResponse = CheckoutResponseMP | CheckoutResponseTransfer

export async function startCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const { data } = await api.post<CheckoutResponse>('/orders/checkout', payload)
  return data
}

export async function confirmOrder(orderId: string, paymentId: string): Promise<Order> {
  const { data } = await api.post<Order>('/orders/confirm', { orderId, paymentId })
  return data
}

export async function getMyOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>('/orders/my')
  return data
}

export async function getOrderById(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`)
  return data
}

export interface TransferProofPayload {
  transferDate: string
  amount: number
  fromBank: string
  reference: string
  notes?: string
  receiptImageUrl?: string
}


export interface TrackingEvento {
  timestamp: string
  location: string | null
  description: string
}

export interface TrackingResult {
  trackingNumber: string
  status: string
  carrier: string
  eventos: TrackingEvento[]
}

export async function getOrderTracking(orderId: string): Promise<TrackingResult> {
  const { data } = await api.get<TrackingResult>(`/orders/${orderId}/tracking`)
  return data
}

export async function submitTransferProof(
  orderId: string,
  payload: TransferProofPayload
): Promise<Order> {
  const { data } = await api.patch<Order>(`/orders/${orderId}/transfer-proof`, payload)
  return data
}
