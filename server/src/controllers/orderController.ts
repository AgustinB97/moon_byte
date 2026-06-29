import type { Request, Response } from 'express'
import { Order, type PaymentMethod } from '../models/Order'
import { Product } from '../models/Product'
import { User } from '../models/User'
import { sendOrderConfirmation } from '../services/email'
import {
  createPreference,
  verifyPayment,
  verifyWebhookSignature,
} from '../services/payment/mercadopago'
import type { AuthRequest } from '../types'
import { createShipmentForOrder, obtenerTracking } from '../modules/shipping/shipping.service'

interface ItemInput {
  product: string
  quantity: number
}

interface AddressInput {
  street: string
  city: string
  state: string
  postalCode: string
  country?: string
}

interface BillingInfoInput {
  invoiceType: 'A' | 'B' | 'C'
  name: string
  taxId: string
  taxCategory: 'consumidor_final' | 'monotributo' | 'responsable_inscripto' | 'exento'
  billingAddress: AddressInput
}

interface ShippingExtraInput {
  apartment?: string
  phone?: string
  deliveryNotes?: string
}

interface CheckoutBody {
  items: ItemInput[]
  paymentMethod: PaymentMethod
  shippingAddress: AddressInput
  shippingExtra?: ShippingExtraInput
  billingInfo: BillingInfoInput
  shippingCost?: number
}

// ─────────────────────────────────────────────────────────────
// Validación común de billing + shipping
// ─────────────────────────────────────────────────────────────
function validateCheckoutBody(body: Partial<CheckoutBody>): string | null {
  if (!body.items?.length) return 'El pedido debe tener al menos un producto'
  if (!body.paymentMethod || !['mercadopago', 'transferencia'].includes(body.paymentMethod)) {
    return 'Método de pago inválido'
  }
  if (!body.shippingAddress?.street) return 'Dirección de envío incompleta'
  if (!body.billingInfo) return 'Datos de facturación requeridos'

  const b = body.billingInfo
  if (!b.invoiceType || !['A', 'B', 'C'].includes(b.invoiceType)) return 'Tipo de factura inválido'
  if (!b.name?.trim()) return 'Nombre / razón social es obligatorio'
  if (!b.taxId?.trim()) return 'CUIT / DNI es obligatorio'
  if (!b.taxCategory) return 'Categoría fiscal es obligatoria'
  if (!b.billingAddress?.street) return 'Domicilio de facturación incompleto'

  return null
}

function getBankInfo() {
  return {
    holder: process.env.BANK_HOLDER ?? 'MoonByte',
    cbu: process.env.BANK_CBU ?? '0000000000000000000000',
    alias: process.env.BANK_ALIAS ?? 'MOONBYTE.HARDWARE',
    bankName: process.env.BANK_NAME ?? 'Banco',
  }
}

// ─────────────────────────────────────────────────────────────
// Resolver items con productos y total
// Si paymentMethod=transferencia → usa priceCash (más barato)
// Si paymentMethod=mercadopago → usa price (con MP)
// ─────────────────────────────────────────────────────────────
async function resolveItemsAndTotal(items: ItemInput[], method: PaymentMethod) {
  const productIds = items.map((i) => i.product)
  const products = await Product.find({ _id: { $in: productIds }, status: 'active' })

  let total = 0
  const orderItems = items.map((item) => {
    const product = products.find((p) => String(p._id) === item.product)
    if (!product) throw new Error(`Producto ${item.product} no encontrado`)
    if (product.stock < item.quantity) {
      throw new Error(`Stock insuficiente para ${product.name}`)
    }
    const unitPrice = method === 'transferencia' ? product.priceCash : product.price
    total += unitPrice * item.quantity
    return {
      product: product._id,
      name: product.name,
      price: unitPrice,
      quantity: item.quantity,
      image: product.images[0] ?? '',
    }
  })

  return { orderItems, total }
}

// ─────────────────────────────────────────────────────────────
// POST /api/orders/checkout
// Endpoint unificado: maneja MP y transferencia
// ─────────────────────────────────────────────────────────────
export async function startCheckout(req: AuthRequest, res: Response): Promise<void> {
  const body = req.body as CheckoutBody
  const err = validateCheckoutBody(body)
  if (err) {
    res.status(400).json({ message: err })
    return
  }

  const { orderItems, total: subtotal } = await resolveItemsAndTotal(body.items, body.paymentMethod)
  const shippingCost = Math.max(0, body.shippingCost ?? 0)
  const total = subtotal + shippingCost

  const order = await Order.create({
    user: req.user!.id,
    items: orderItems,
    total,
    shippingCost,
    status: 'pending',
    paymentMethod: body.paymentMethod,
    shippingAddress: body.shippingAddress,
    shippingExtra: body.shippingExtra,
    billingInfo: body.billingInfo,
  })

  // ── Rama transferencia ──
  if (body.paymentMethod === 'transferencia') {
    const bankInfo = getBankInfo()

    // Mail con datos bancarios para el cliente (no bloquea)
    // El link va con anchor #comprobante para scrollear al form al abrir
    try {
      const user = await User.findById(req.user!.id)
      if (user) {
        const trackingUrl = `${process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'}/pedidos/${order._id}#comprobante`
        await sendOrderConfirmation(
          user.email,
          user.name,
          order._id.toString(),
          orderItems.map((i: { name: string; quantity: number; price: number }) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
          total,
          trackingUrl,
          bankInfo
        )
      }
    } catch (err) {
      console.error('[ORDER] Mail transferencia falló:', err instanceof Error ? err.message : err)
    }

    res.status(201).json({
      orderId: order._id,
      paymentMethod: 'transferencia',
      total,
      bankInfo,
      message: 'Pedido creado. Realizá la transferencia con los datos provistos.',
    })
    return
  }

  // ── Rama MP ──
  const user = await User.findById(req.user!.id)
  if (!user) {
    await Order.findByIdAndDelete(order._id)
    res.status(404).json({ message: 'Usuario no encontrado' })
    return
  }

  const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

  try {
    const mpItems = [
      ...orderItems.map((i) => ({
        id: String(i.product),
        title: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        picture_url: i.image || undefined,
      })),
      ...(shippingCost > 0 ? [{
        id: 'envio',
        title: 'Costo de envío',
        quantity: 1,
        unit_price: shippingCost,
      }] : []),
    ]

    const preference = await createPreference({
      orderId: order._id.toString(),
      items: mpItems,
      payer: { name: user.name, email: user.email },
      backUrls: {
        success: `${clientOrigin}/checkout/success`,
        failure: `${clientOrigin}/checkout/failure`,
        pending: `${clientOrigin}/checkout/success`,
      },
    })

    res.status(201).json({
      orderId: order._id,
      paymentMethod: 'mercadopago',
      preferenceId: preference.id,
      initPoint: preference.init_point,
      isMock: preference.isMock,
    })
  } catch (mpErr) {
    console.error('[MP] Error completo:', JSON.stringify(mpErr, null, 2))
    await Order.findByIdAndDelete(order._id)
    throw mpErr
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/orders/confirm (MP only — transferencia no necesita confirm)
// ─────────────────────────────────────────────────────────────
export async function confirmOrder(req: AuthRequest, res: Response): Promise<void> {
  const { orderId, paymentId } = req.body as { orderId: string; paymentId?: string }

  const order = await Order.findOne({ _id: orderId, user: req.user!.id })
  if (!order) {
    res.status(404).json({ message: 'Pedido no encontrado' })
    return
  }

  if (order.status !== 'pending') {
    res.json(order)
    return
  }

  if (order.paymentMethod !== 'mercadopago') {
    res.status(400).json({ message: 'Este pedido no se paga con MP' })
    return
  }

  if (!paymentId) {
    res.status(400).json({ message: 'paymentId es requerido' })
    return
  }

  try {
    const verification = await verifyPayment(paymentId)
    if (!verification.approved) {
      res.status(402).json({ message: 'El pago no fue aprobado', status: verification.status })
      return
    }
    if (!verification.externalReference || verification.externalReference !== orderId) {
      console.warn(
        `[SECURITY] external_reference mismatch: ${verification.externalReference} != ${orderId}`
      )
      res.status(403).json({ message: 'El pago no corresponde a este pedido' })
      return
    }
  } catch (verifyErr) {
    console.error('[PAYMENT] Error verificando:', verifyErr instanceof Error ? verifyErr.message : verifyErr)
    res.status(502).json({ message: 'No pudimos verificar el pago. Reintentá en unos segundos.' })
    return
  }

  // Actualización atómica: solo procede si sigue en 'pending' — evita doble proceso con webhook
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: 'pending' },
    { $set: { status: 'processing' } },
    { new: true }
  )
  if (!updated) {
    // Otro proceso (webhook) ya lo procesó
    res.json(order)
    return
  }

  await Promise.all(
    order.items.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
    )
  )

  // Crear etiqueta de envío en Envia.com (no bloquea — si falla se loguea)
  createShipmentForOrder(order._id.toString()).catch(() => {})

  await sendConfirmationEmail(
    req.user!.id,
    order._id.toString(),
    order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
    order.total
  )

  res.json(order)
}

// ─────────────────────────────────────────────────────────────
// Legacy POST /api/orders — wrapped to /checkout flow
// ─────────────────────────────────────────────────────────────
export async function createOrder(req: AuthRequest, res: Response): Promise<void> {
  // Compatibilidad: redirecciona al checkout flow
  await startCheckout(req, res)
}

// ─────────────────────────────────────────────────────────────
// POST /api/orders/webhook — MP notifications
// ─────────────────────────────────────────────────────────────
export async function mpWebhook(req: Request, res: Response): Promise<void> {
  const { type, data } = req.body as { type?: string; data?: { id?: string } }
  if (type !== 'payment' || !data?.id) {
    res.sendStatus(200)
    return
  }

  const xSignature = req.headers['x-signature'] as string | undefined
  const xRequestId = req.headers['x-request-id'] as string | undefined

  if (!verifyWebhookSignature(xSignature, xRequestId, data.id)) {
    console.warn('[MP-WEBHOOK] ⚠ Firma inválida')
    res.sendStatus(401)
    return
  }

  try {
    const verification = await verifyPayment(data.id)
    if (verification.approved && verification.externalReference) {
      // Actualización atómica: evita doble proceso si /confirm y webhook llegan simultáneamente
      const order = await Order.findOneAndUpdate(
        { _id: verification.externalReference, status: 'pending' },
        { $set: { status: 'processing' } },
        { new: true }
      )
      if (order) {
        await Promise.all(
          order.items.map((item) =>
            Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
          )
        )
        createShipmentForOrder(order._id.toString()).catch(() => {})
      }
    }
  } catch (err) {
    console.error('[MP-WEBHOOK] Error procesando:', err instanceof Error ? err.message : err)
  }

  res.sendStatus(200)
}

// ─────────────────────────────────────────────────────────────
// GET /api/orders/:id/tracking
// ─────────────────────────────────────────────────────────────
export async function getOrderTracking(req: AuthRequest, res: Response): Promise<void> {
  const order = await Order.findOne({ _id: req.params.id, user: req.user!.id })
  if (!order) {
    res.status(404).json({ message: 'Pedido no encontrado' })
    return
  }

  if (!order.trackingNumber) {
    res.status(404).json({ message: 'Este pedido aún no tiene número de seguimiento' })
    return
  }

  const result = await obtenerTracking(order.trackingNumber)
  res.json(result)
}

// ─────────────────────────────────────────────────────────────
async function sendConfirmationEmail(
  userId: string,
  orderId: string,
  items: { name: string; quantity: number; price: number }[],
  total: number
): Promise<void> {
  try {
    const user = await User.findById(userId)
    if (!user) return
    const trackingUrl = `${process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'}/pedidos/${orderId}`
    await sendOrderConfirmation(user.email, user.name, orderId, items, total, trackingUrl)
  } catch (err) {
    console.error('[ORDER] Email falló:', err instanceof Error ? err.message : err)
  }
}

export async function getMyOrders(req: AuthRequest, res: Response): Promise<void> {
  const orders = await Order.find({ user: req.user!.id }).sort({ createdAt: -1 }).lean()
  res.json(orders)
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/orders/:id/transfer-proof
// El cliente sube los datos del comprobante de transferencia
// ─────────────────────────────────────────────────────────────
interface TransferProofInput {
  transferDate?: string  // ISO
  amount?: number
  fromBank?: string
  reference?: string
  notes?: string
  receiptImageUrl?: string
}

export async function submitTransferProof(req: AuthRequest, res: Response): Promise<void> {
  const body = req.body as TransferProofInput

  // Modo: o se cargan los datos completos, o se sube el comprobante (file).
  // Al menos uno de los dos modos tiene que estar completo.
  const hasImage = !!body.receiptImageUrl?.trim()
  const hasManualData =
    !!body.transferDate &&
    !!body.amount && body.amount > 0 &&
    !!body.fromBank?.trim() &&
    !!body.reference?.trim()

  if (!hasImage && !hasManualData) {
    res.status(400).json({
      message: 'Cargá los datos de la transferencia O subí una imagen del comprobante',
    })
    return
  }

  // Si es modo manual, todos los campos críticos son requeridos
  if (!hasImage) {
    if (!body.transferDate) {
      res.status(400).json({ message: 'La fecha de transferencia es requerida' })
      return
    }
    if (!body.amount || body.amount <= 0) {
      res.status(400).json({ message: 'El monto es requerido' })
      return
    }
    if (!body.fromBank?.trim()) {
      res.status(400).json({ message: 'El banco origen es requerido' })
      return
    }
    if (!body.reference?.trim()) {
      res.status(400).json({ message: 'El número de operación es requerido' })
      return
    }
  }

  const order = await Order.findOne({ _id: req.params.id, user: req.user!.id })
  if (!order) {
    res.status(404).json({ message: 'Pedido no encontrado' })
    return
  }

  if (order.paymentMethod !== 'transferencia') {
    res.status(400).json({ message: 'Este pedido no se paga por transferencia' })
    return
  }

  if (order.transferProof?.submittedAt) {
    res.status(409).json({ message: 'Ya enviaste un comprobante para este pedido' })
    return
  }

  order.transferProof = {
    transferDate: body.transferDate ? new Date(body.transferDate) : new Date(),
    amount: body.amount ?? 0,
    fromBank: body.fromBank?.trim() ?? '',
    reference: body.reference?.trim() ?? '',
    notes: body.notes?.trim(),
    receiptImageUrl: body.receiptImageUrl?.trim(),
    submittedAt: new Date(),
  }
  await order.save()

  res.json(order)
}

export async function getOrderById(req: AuthRequest, res: Response): Promise<void> {
  const order = await Order.findOne({ _id: req.params.id, user: req.user!.id }).lean()
  if (!order) {
    res.status(404).json({ message: 'Pedido no encontrado' })
    return
  }

  // Mientras la orden esté pendiente (transferencia), incluir datos bancarios
  // aunque el cliente ya haya subido el comprobante — los siguen viendo de referencia.
  // Cuando el admin marca como "Confirmado" (processing) o más, dejamos de mandarlos.
  const needsBankInfo =
    order.paymentMethod === 'transferencia' &&
    order.status === 'pending'

  res.json({
    ...order,
    ...(needsBankInfo ? { bankInfo: getBankInfo() } : {}),
  })
}
