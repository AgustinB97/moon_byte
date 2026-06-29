import api from './api'
import type { Order, OrderStatus, Product, PaginatedResponse } from '@/types'

export interface DashboardStats {
  salesToday: { total: number; count: number }
  pendingOrders: number
  totalUsers: number
  lowStockCount: number
  totalProducts: number
  recentOrders: Order[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/admin/stats')
  return data
}

export async function getAllOrders(params: {
  status?: OrderStatus
  page?: number
  limit?: number
} = {}): Promise<PaginatedResponse<Order>> {
  const search = new URLSearchParams()
  if (params.status) search.set('status', params.status)
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))

  const { data } = await api.get<PaginatedResponse<Order>>(`/admin/orders?${search}`)
  return data
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const { data } = await api.patch<Order>(`/admin/orders/${orderId}/status`, { status })
  return data
}

// Productos: admin ve TODOS (activos + pendings)
export async function getProductsForAdmin(params: {
  search?: string
  page?: number
  limit?: number
} = {}): Promise<PaginatedResponse<Product>> {
  const search = new URLSearchParams()
  if (params.search) search.set('search', params.search)
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))

  const { data } = await api.get<PaginatedResponse<Product>>(`/products/admin/all?${search}`)
  return data
}

// Productos (usan endpoints existentes de /products con auth admin)
// El backend devuelve { message, product } por el flow de approval.
// Extraemos .product para devolver Product directo y mantener el tipo.

interface ProductWriteResponse {
  message: string
  product: Product
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const { data } = await api.post<ProductWriteResponse>('/products', payload)
  return data.product
}

export async function updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  const { data } = await api.put<ProductWriteResponse>(`/products/${id}`, payload)
  return data.product
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`)
}

export async function cancelShipment(orderId: string): Promise<void> {
  await api.post('/shipping/cancelar', { orderId })
}
