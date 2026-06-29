import { cotizarEnvia, crearEtiquetaEnvia, trackingEnvia, cancelarEnvia, EnviaApiError } from './envia.client'
import { Shipment } from './shipping.model'
import { Order } from '../../models/Order'
import { User } from '../../models/User'
import { Product } from '../../models/Product'
import { sendShipmentCancelled } from '../../services/email'
import { generateToken, hashToken, TOKEN_TTL } from '../../utils/tokens'
import type {
  CotizarEnvioInput,
  CotizacionResult,
  CrearEtiquetaInput,
  EtiquetaCreada,
  TrackingResult,
  PaqueteEnvio,
  DireccionEnvio,
} from './shipping.types'

// ── Error tipado ─────────────────────────────────────────────

export class ShippingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ShippingError'
  }
}

// ── Servicio ─────────────────────────────────────────────────

export async function cotizarEnvio(input: CotizarEnvioInput): Promise<CotizacionResult> {
  let opciones
  try {
    opciones = await cotizarEnvia(input)
  } catch (err) {
    if (err instanceof EnviaApiError) {
      throw new ShippingError(err.message)
    }
    throw err
  }

  const carrier = process.env.ENVIA_CARRIER ?? 'andreani'
  console.log(`[SHIPPING] Carriers recibidos:`, opciones.map((o) => `${o.carrier}/${o.service}`))

  const opcion = opciones.find((o) => o.carrier.toLowerCase() === carrier.toLowerCase())

  if (!opcion) {
    throw new ShippingError(`No se encontró opción de ${carrier} en la respuesta de Envia.com`)
  }

  return { opcion }
}

export async function crearEtiqueta(input: CrearEtiquetaInput): Promise<EtiquetaCreada> {
  let etiqueta: EtiquetaCreada
  try {
    etiqueta = await crearEtiquetaEnvia(input)
  } catch (err) {
    if (err instanceof EnviaApiError) {
      throw new ShippingError(`Envia.com rechazó la etiqueta: ${err.message}`)
    }
    throw err
  }

  await Shipment.create({
    orderId: input.orderId,
    shipmentId: etiqueta.shipmentId,
    trackingNumber: etiqueta.trackingNumber,
    carrier: etiqueta.carrier,
    service: input.service,
    labelUrl: etiqueta.labelUrl,
    totalPrice: etiqueta.totalPrice,
    currency: etiqueta.currency,
  })

  return etiqueta
}

export async function createShipmentForOrder(orderId: string): Promise<EtiquetaCreada | null> {
  const order = await Order.findById(orderId)
  if (!order) {
    console.warn(`[SHIPPING] Orden ${orderId} no encontrada`)
    return null
  }

  if (order.trackingNumber) {
    console.warn(`[SHIPPING] Orden ${orderId} ya tiene envío creado (${order.trackingNumber})`)
    return null
  }

  const user = await User.findById(order.user)
  if (!user) {
    console.warn(`[SHIPPING] Usuario no encontrado para orden ${orderId}`)
    return null
  }

  const productIds = order.items.map((i) => i.product)
  const products = await Product.find({ _id: { $in: productIds } })

  // Validar dimensiones antes de continuar
  const sinDimensiones = order.items.filter((item) => {
    const p = products.find((p) => String(p._id) === String(item.product))
    return !p || !p.pesoEmbalado || !p.alto || !p.ancho || !p.largo
  })

  if (sinDimensiones.length > 0) {
    const nombres = sinDimensiones.map((i) => `"${i.name}"`).join(', ')
    console.error(
      `[SHIPPING] ✗ Orden ${orderId} — faltan dimensiones en: ${nombres}. ` +
      `Cargá pesoEmbalado, alto, ancho y largo en cada producto antes de despachar.`
    )
    return null
  }

  const paquetes: PaqueteEnvio[] = order.items.map((item) => {
    const product = products.find((p) => String(p._id) === String(item.product))!
    return {
      tipo: 'box',
      contenido: item.name,
      cantidad: item.quantity,
      valorDeclarado: item.price * item.quantity,
      unidadLongitud: 'CM',
      unidadPeso: 'KG',
      peso: product.pesoEmbalado! / 1000,
      dimensiones: {
        largo: product.largo!,
        ancho: product.ancho!,
        alto: product.alto!,
      },
    }
  })

  const origen: DireccionEnvio = {
    nombre: process.env.ENVIA_ORIGEN_NOMBRE ?? 'MoonByte',
    telefono: process.env.ENVIA_ORIGEN_TELEFONO ?? '0000000000',
    calle: process.env.ENVIA_ORIGEN_CALLE ?? 'Sin calle',
    ciudad: process.env.ENVIA_ORIGEN_CIUDAD ?? 'Buenos Aires',
    provincia: process.env.ENVIA_ORIGEN_PROVINCIA ?? 'Buenos Aires',
    pais: 'AR',
    codigoPostal: process.env.ENVIA_ORIGEN_CP ?? '1000',
  }

  const destino: DireccionEnvio = {
    nombre: user.name,
    telefono: order.shippingExtra?.phone ?? '0000000000',
    email: user.email,
    calle: order.shippingAddress.street,
    ciudad: order.shippingAddress.city,
    provincia: order.shippingAddress.state,
    pais: 'AR',
    codigoPostal: order.shippingAddress.postalCode,
  }

  const input: CrearEtiquetaInput = {
    orderId,
    origen,
    destino,
    paquetes,
    service: order.shippingService ?? process.env.ENVIA_SERVICE ?? 'standard',
  }

  try {
    const etiqueta = await crearEtiqueta(input)

    await Order.findByIdAndUpdate(orderId, {
      shipmentId: etiqueta.shipmentId,
      trackingNumber: etiqueta.trackingNumber,
      labelUrl: etiqueta.labelUrl,
    })

    console.log(`[SHIPPING] Etiqueta creada para orden ${orderId} — tracking: ${etiqueta.trackingNumber}`)
    return etiqueta
  } catch (err) {
    console.error(`[SHIPPING] Error creando etiqueta para orden ${orderId}:`, err instanceof Error ? err.message : err)
    return null
  }
}

/** Paso 1: genera token, guarda en la orden y envía mail de confirmación al APPROVAL_EMAIL */
export async function solicitarCancelacion(orderId: string): Promise<void> {
  const order = await Order.findById(orderId)
  if (!order) throw new ShippingError('Orden no encontrada')
  if (!order.shipmentId) throw new ShippingError('Esta orden no tiene un envío creado en Envia.com')

  const { raw, hashed } = generateToken()
  await Order.findByIdAndUpdate(orderId, {
    cancelShipmentToken: hashed,
    cancelShipmentExpires: new Date(Date.now() + TOKEN_TTL.VERIFICATION),
  })

  const user = await User.findById(order.user)
  const confirmUrl = `${process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'}/shipping/cancelar-confirmar/${raw}`

  sendShipmentCancelled({
    orderId,
    customerName: user?.name ?? 'Cliente desconocido',
    customerEmail: user?.email ?? '',
    shipmentId: order.shipmentId,
    trackingNumber: order.trackingNumber,
    confirmUrl,
  }).catch((err) => {
    console.error('[SHIPPING] Mail de confirmación falló:', err instanceof Error ? err.message : err)
  })

  console.log(`[SHIPPING] Cancelación solicitada para orden ${orderId} — esperando confirmación por email`)
}

/** Paso 2: valida token y ejecuta la cancelación real en Envia.com */
export async function confirmarCancelacion(token: string): Promise<void> {
  const hashed = hashToken(token)

  // Consumir el token atómicamente — si dos requests llegan simultáneos, solo uno procede
  const order = await Order.findOneAndUpdate(
    {
      cancelShipmentToken: hashed,
      cancelShipmentExpires: { $gt: new Date() },
    },
    { $unset: { cancelShipmentToken: '', cancelShipmentExpires: '' } },
    { new: false, select: 'shipmentId trackingNumber labelUrl user' }
  )

  if (!order) throw new ShippingError('Link inválido, ya utilizado o expirado')
  if (!order.shipmentId) throw new ShippingError('Esta orden ya no tiene un envío activo')

  // Ejecutar cancelación real en Envia.com
  try {
    await cancelarEnvia(order.shipmentId)
  } catch (err) {
    if (err instanceof EnviaApiError) {
      throw new ShippingError(`Envia.com rechazó la cancelación: ${err.message}`)
    }
    throw err
  }

  // Limpiar datos de envío y token
  await Order.findByIdAndUpdate(order._id, {
    $unset: { shipmentId: '', trackingNumber: '', labelUrl: '', cancelShipmentToken: '', cancelShipmentExpires: '' },
  })
  await Shipment.deleteOne({ orderId: order._id })

  console.log(`[SHIPPING] Envío cancelado confirmado para orden ${order._id}`)
}

export async function obtenerTracking(trackingNumber: string): Promise<TrackingResult> {
  try {
    return await trackingEnvia(trackingNumber)
  } catch (err) {
    if (err instanceof EnviaApiError) {
      throw new ShippingError(`Envia.com no pudo obtener el tracking: ${err.message}`)
    }
    throw err
  }
}
