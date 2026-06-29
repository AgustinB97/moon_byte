import api from './api'
import type { Product, PaginatedResponse, ProductFilters } from '@/types'

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams()

  // Filtros avanzados (multi-valor, coma-separados)
  if (filters.categories?.length) params.set('categories', filters.categories.join(','))
  else if (filters.category)      params.set('category', filters.category)

  if (filters.brands?.length) params.set('brands', filters.brands.join(','))
  else if (filters.brand)     params.set('brand', filters.brand)

  if (filters.inStock)   params.set('inStock', 'true')
  if (filters.featured)  params.set('featured', 'true')

  // Precio / búsqueda / orden / paginación
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice))
  if (filters.search)  params.set('search', filters.search)
  if (filters.sort)    params.set('sort', filters.sort)
  if (filters.page)    params.set('page', String(filters.page))
  if (filters.limit)   params.set('limit', String(filters.limit))

  const { data } = await api.get<PaginatedResponse<Product>>(`/products?${params}`)
  return data
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const { data } = await api.get<Product>(`/products/${slug}`)
  return data
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>('/products/featured')
  return data
}
