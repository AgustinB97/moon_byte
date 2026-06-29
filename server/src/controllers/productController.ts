import type { Request, Response } from 'express'
import type { SortOrder } from 'mongoose'
import { Product } from '../models/Product'
import { User } from '../models/User'
import { deleteImage, extractPublicId } from '../services/storage/cloudinary'
import { sendProductApproval } from '../services/email'
import { calculatePrices } from '../utils/pricing'
import { generateToken, hashToken, isExpired, TOKEN_TTL } from '../utils/tokens'
import type { AuthRequest } from '../types'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function buildApprovalUrl(token: string): string {
  const base = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
  return `${base}/admin/aprobar/${token}`
}

function productToSnapshot(p: {
  name: string
  slug: string
  brand: string
  cost: number
  price: number
  priceCash: number
  description?: string
  category?: string
  stock?: number
  images?: string[]
}) {
  return {
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    cost: p.cost,
    priceWithMP: p.price,
    priceCash: p.priceCash,
    description: p.description,
    category: p.category,
    stock: p.stock,
    images: p.images,
  }
}

async function getApproverName(userId: string): Promise<string> {
  const user = await User.findById(userId).lean()
  return user?.name ?? 'Admin'
}

// ─────────────────────────────────────────────────────────────
// PUBLIC: GET /api/products
// ─────────────────────────────────────────────────────────────
export async function getProducts(req: Request, res: Response): Promise<void> {
  const {
    category,
    categories,
    search,
    minPrice,
    maxPrice,
    brand,
    brands,
    sort = 'price-desc',
    page = '1',
    limit = '12',
    inStock,
    featured,
  } = req.query

  // Solo productos activos para el público
  const filter: Record<string, unknown> = { status: 'active' }

  // Categorías: acepta una sola (category) o varias coma-separadas (categories)
  const categoryList = categories
    ? String(categories).split(',').map((c) => c.trim()).filter(Boolean)
    : category
    ? [String(category).trim()]
    : []
  if (categoryList.length === 1) filter.category = categoryList[0]
  if (categoryList.length > 1) filter.category = { $in: categoryList }

  // Marcas: acepta una sola (brand) o varias coma-separadas (brands)
  // Match exacto case-insensitive para evitar falsos positivos con regex sin anclar
  const brandList = brands
    ? String(brands).split(',').map((b) => b.trim()).filter(Boolean)
    : brand
    ? [String(brand).trim()]
    : []
  if (brandList.length === 1) {
    filter.brand = new RegExp(`^${brandList[0]}$`, 'i')
  }
  if (brandList.length > 1) {
    filter.brand = { $in: brandList.map((b) => new RegExp(`^${b}$`, 'i')) }
  }

  // Rango de precio
  if (minPrice || maxPrice) {
    filter.price = {}
    if (minPrice) (filter.price as Record<string, number>).$gte = Number(minPrice)
    if (maxPrice) (filter.price as Record<string, number>).$lte = Number(maxPrice)
  }

  // Solo con stock disponible
  if (inStock === 'true') filter.stock = { $gt: 0 }

  // Solo destacados
  if (featured === 'true') filter.featured = true

  // Búsqueda por texto
  if (search) filter.$text = { $search: String(search) }

  const sortMap: Record<string, Record<string, SortOrder>> = {
    'price-desc': { price: -1 },
    'price-asc': { price: 1 },
    newest: { createdAt: -1 },
    rating: { rating: -1 },
    'name-asc': { name: 1 },
  }

  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.min(48, Math.max(1, Number(limit)))
  const skip = (pageNum - 1) * limitNum

  const [data, total] = await Promise.all([
    Product.find(filter)
      .sort(sortMap[String(sort)] ?? sortMap['price-desc'])
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter),
  ])

  res.json({
    data,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    limit: limitNum,
  })
}

export async function getFeaturedProducts(_req: Request, res: Response): Promise<void> {
  const products = await Product.find({ featured: true, status: 'active' }).limit(6).lean()
  res.json(products)
}

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  const product = await Product.findOne({ slug: req.params.slug, status: 'active' }).lean()
  if (!product) {
    res.status(404).json({ message: 'Producto no encontrado' })
    return
  }
  res.json(product)
}

// ─────────────────────────────────────────────────────────────
// ADMIN: GET /api/products/admin (lista TODO incluyendo pendings)
// ─────────────────────────────────────────────────────────────
export async function getProductsForAdmin(req: Request, res: Response): Promise<void> {
  const { search, page = '1', limit = '20' } = req.query
  const filter: Record<string, unknown> = {}
  if (search) filter.$text = { $search: String(search) }

  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.min(50, Math.max(1, Number(limit)))
  const skip = (pageNum - 1) * limitNum

  const [data, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Product.countDocuments(filter),
  ])

  res.json({ data, total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum })
}

// ─────────────────────────────────────────────────────────────
// ADMIN: POST /api/products
// Crea el producto en estado pending_approval. Solo se activa al
// hacer click en el link del mail de aprobación.
// ─────────────────────────────────────────────────────────────
export async function createProduct(req: AuthRequest, res: Response): Promise<void> {
  const body = req.body as { cost: number; weightGrams?: number; dimensions?: { heightCm?: number; widthCm?: number; depthCm?: number }; [k: string]: unknown }

  if (typeof body.cost !== 'number' || body.cost < 0) {
    res.status(400).json({ message: 'El costo es requerido y debe ser un número positivo' })
    return
  }

  // Mapear nombres del frontend → modelo
  const { weightGrams, dimensions, ...restBody } = body
  const mapped: Record<string, unknown> = { ...restBody }
  if (weightGrams !== undefined) mapped.pesoEmbalado = weightGrams
  if (dimensions && typeof dimensions === 'object') {
    if (dimensions.heightCm !== undefined) mapped.alto  = dimensions.heightCm
    if (dimensions.widthCm  !== undefined) mapped.ancho = dimensions.widthCm
    if (dimensions.depthCm  !== undefined) mapped.largo = dimensions.depthCm
  }

  const { priceWithMP, priceCash } = calculatePrices(body.cost)
  const { raw, hashed } = generateToken()

  const product = await Product.create({
    ...mapped,
    price: priceWithMP,
    priceCash,
    status: 'pending_approval',
    pendingAction: 'create',
    approvalToken: hashed,
    approvalExpires: new Date(Date.now() + TOKEN_TTL.VERIFICATION),
  })

  // Mail de aprobación
  try {
    const approverName = await getApproverName(req.user!.id)
    await sendProductApproval(
      'create',
      approverName,
      productToSnapshot(product),
      buildApprovalUrl(raw)
    )
  } catch (err) {
    console.error('[PRODUCT] Mail approval falló:', err instanceof Error ? err.message : err)
  }

  res.status(201).json({
    message: 'Producto creado. Esperando aprobación por email.',
    product: product.toJSON(),
  })
}

// ─────────────────────────────────────────────────────────────
// ADMIN: PUT /api/products/:id
// Almacena los cambios en pendingChanges sin tocar el producto activo.
// Cuando se aprueba, los pendingChanges se aplican.
// ─────────────────────────────────────────────────────────────
export async function updateProduct(req: AuthRequest, res: Response): Promise<void> {
  const existing = await Product.findById(req.params.id)
  if (!existing) {
    res.status(404).json({ message: 'Producto no encontrado' })
    return
  }

  // No permitir editar si ya hay un cambio pending (debe aprobarse o expirar primero)
  if (existing.pendingAction) {
    res.status(409).json({
      message: 'Este producto ya tiene un cambio pendiente de aprobación. Esperá a que se confirme o expire.',
    })
    return
  }

  const body = req.body as { cost?: number; weightGrams?: number; dimensions?: { heightCm?: number; widthCm?: number; depthCm?: number }; [k: string]: unknown }

  // Mapear nombres del frontend → modelo antes de guardar en pendingChanges
  const { weightGrams, dimensions, ...restBody } = body
  const pendingChanges: Record<string, unknown> = { ...restBody }

  if (weightGrams !== undefined) pendingChanges.pesoEmbalado = weightGrams
  if (dimensions && typeof dimensions === 'object') {
    if (dimensions.heightCm !== undefined) pendingChanges.alto  = dimensions.heightCm
    if (dimensions.widthCm  !== undefined) pendingChanges.ancho = dimensions.widthCm
    if (dimensions.depthCm  !== undefined) pendingChanges.largo = dimensions.depthCm
  }

  // Si cambia cost, recalcular precios
  if (typeof body.cost === 'number' && body.cost !== existing.cost) {
    const { priceWithMP, priceCash } = calculatePrices(body.cost)
    pendingChanges.price = priceWithMP
    pendingChanges.priceCash = priceCash
  }

  const { raw, hashed } = generateToken()
  existing.pendingAction = 'update'
  existing.pendingChanges = pendingChanges
  existing.approvalToken = hashed
  existing.approvalExpires = new Date(Date.now() + TOKEN_TTL.VERIFICATION)
  await existing.save()

  try {
    const approverName = await getApproverName(req.user!.id)
    const proposedSnapshot = {
      ...productToSnapshot(existing),
      ...(pendingChanges as Partial<ReturnType<typeof productToSnapshot>>),
      priceWithMP: (pendingChanges.price as number) ?? existing.price,
      priceCash: (pendingChanges.priceCash as number) ?? existing.priceCash,
    }
    await sendProductApproval(
      'update',
      approverName,
      proposedSnapshot,
      buildApprovalUrl(raw),
      productToSnapshot(existing)
    )
  } catch (err) {
    console.error('[PRODUCT] Mail approval falló:', err instanceof Error ? err.message : err)
  }

  res.json({
    message: 'Cambios guardados. Esperando aprobación por email.',
    product: existing.toJSON(),
  })
}

// ─────────────────────────────────────────────────────────────
// ADMIN: DELETE /api/products/:id
// Marca el producto con pendingAction='delete'. Solo se borra al aprobar.
// ─────────────────────────────────────────────────────────────
export async function deleteProduct(req: AuthRequest, res: Response): Promise<void> {
  const existing = await Product.findById(req.params.id)
  if (!existing) {
    res.status(404).json({ message: 'Producto no encontrado' })
    return
  }

  if (existing.pendingAction) {
    res.status(409).json({
      message: 'Este producto ya tiene un cambio pendiente. Esperá a que se confirme o expire.',
    })
    return
  }

  const { raw, hashed } = generateToken()
  existing.pendingAction = 'delete'
  existing.approvalToken = hashed
  existing.approvalExpires = new Date(Date.now() + TOKEN_TTL.VERIFICATION)
  await existing.save()

  try {
    const approverName = await getApproverName(req.user!.id)
    await sendProductApproval(
      'delete',
      approverName,
      productToSnapshot(existing),
      buildApprovalUrl(raw)
    )
  } catch (err) {
    console.error('[PRODUCT] Mail approval falló:', err instanceof Error ? err.message : err)
  }

  res.json({ message: 'Eliminación solicitada. Esperando aprobación por email.' })
}

// ─────────────────────────────────────────────────────────────
// PUBLIC: GET /api/products/approve/:token
// Endpoint público — el token actúa como autenticación.
// Aplica el cambio pending según pendingAction.
// ─────────────────────────────────────────────────────────────
export async function approveProductChange(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  const hashed = hashToken(token)

  const product = await Product.findOne({ approvalToken: hashed }).select(
    '+approvalToken +approvalExpires'
  )

  if (!product) {
    res.status(400).json({ message: 'Link de aprobación inválido' })
    return
  }

  if (isExpired(product.approvalExpires)) {
    res.status(400).json({ message: 'El link expiró. Volvé a hacer el cambio desde el admin.' })
    return
  }

  const action = product.pendingAction
  if (!action) {
    res.status(400).json({ message: 'No hay cambios pendientes para este producto' })
    return
  }

  if (action === 'create') {
    product.status = 'active'
    product.pendingAction = undefined
    product.approvalToken = undefined
    product.approvalExpires = undefined
    await product.save()
    res.json({
      action: 'create',
      message: 'Producto aprobado y activado',
      product: product.toJSON(),
    })
    return
  }

  if (action === 'update') {
    const raw = (product.pendingChanges ?? {}) as Record<string, unknown>

    // Mapear nombres del frontend → campos del modelo
    // El formulario envía weightGrams/dimensions, el modelo usa pesoEmbalado/alto/ancho/largo
    const { weightGrams, dimensions, ...rest } = raw
    const mapped: Record<string, unknown> = { ...rest }

    if (weightGrams !== undefined) mapped.pesoEmbalado = weightGrams

    if (dimensions && typeof dimensions === 'object') {
      const d = dimensions as { heightCm?: number; widthCm?: number; depthCm?: number }
      if (d.heightCm !== undefined) mapped.alto  = d.heightCm
      if (d.widthCm  !== undefined) mapped.ancho = d.widthCm
      if (d.depthCm  !== undefined) mapped.largo = d.depthCm
    }

    // Limpiar imágenes viejas de Cloudinary si cambiaron
    const previousImages = product.images ?? []
    if ('images' in mapped && Array.isArray(mapped.images)) {
      const newSet = new Set(mapped.images as string[])
      const removed = previousImages.filter((url) => !newSet.has(url))
      void cleanupCloudinaryImages(removed)
    }

    // Usar findByIdAndUpdate evita problemas de change-detection de Mongoose
    // con campos Mixed, Maps y arrays
    const updated = await Product.findByIdAndUpdate(
      product._id,
      {
        $set: mapped,
        $unset: { pendingAction: '', pendingChanges: '', approvalToken: '', approvalExpires: '' },
      },
      { new: true, runValidators: false }
    )

    res.json({
      action: 'update',
      message: 'Cambios aplicados',
      product: updated?.toJSON() ?? product.toJSON(),
    })
    return
  }

  if (action === 'delete') {
    const imagesToCleanup = [...product.images]
    await product.deleteOne()
    void cleanupCloudinaryImages(imagesToCleanup)

    res.json({
      action: 'delete',
      message: 'Producto eliminado',
    })
    return
  }
}

// ─────────────────────────────────────────────────────────────
// Cleanup de imágenes en Cloudinary
// ─────────────────────────────────────────────────────────────
async function cleanupCloudinaryImages(urls: string[]): Promise<void> {
  for (const url of urls) {
    const publicId = extractPublicId(url)
    if (publicId) {
      await deleteImage(publicId)
    }
  }
}
