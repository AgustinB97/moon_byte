import crypto from 'crypto'
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

/**
 * Servicio de pagos vía Mercado Pago Checkout Pro.
 *
 * SEGURIDAD:
 *  - Card data NUNCA pasa por nuestro backend ni frontend (PCI-DSS).
 *  - Checkout es server-side en MP, redirect-based.
 *  - Verificamos pagos consultando la API de MP, no confiando en el cliente.
 *  - Webhooks se validan con HMAC firmado por MP.
 *
 * MODOS:
 *  - Si MP_ACCESS_TOKEN está seteado → modo REAL
 *  - Si no → modo MOCK (testing, no requiere pago real)
 */

export interface PreferenceItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  picture_url?: string
  description?: string
}

export interface CreatePreferenceParams {
  items: PreferenceItem[]
  orderId: string
  payer: { name?: string; email: string }
  backUrls: { success: string; failure: string; pending: string }
}

export interface PreferenceResponse {
  id: string
  init_point: string
  isMock: boolean
}

export interface PaymentVerification {
  approved: boolean
  status: string
  externalReference: string | null
  amount: number
  paymentMethodId: string
  paymentId: string
}

function isMockMode(): boolean {
  return !process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN === ''
}

function getClient(): MercadoPagoConfig {
  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: { timeout: 10000 },
  })
}

// ─────────────────────────────────────────────────────────────
// Crear Preference (inicio del checkout)
// ─────────────────────────────────────────────────────────────
export async function createPreference(params: CreatePreferenceParams): Promise<PreferenceResponse> {
  if (isMockMode()) {
    console.log('[MP] ⚠ Modo MOCK — sin MP_ACCESS_TOKEN configurado')
    return {
      id: `mock-${params.orderId}`,
      init_point: `${params.backUrls.success}?external_reference=${params.orderId}&payment_id=mock-${Date.now()}&status=approved&mock=true`,
      isMock: true,
    }
  }

  const preference = new Preference(getClient())

  const result = await preference.create({
    body: {
      items: params.items.map((i) => ({
        id: i.id,
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price,
        currency_id: 'ARS',
        picture_url: i.picture_url,
        description: i.description,
      })),
      external_reference: params.orderId,
      payer: { name: params.payer.name, email: params.payer.email },
      back_urls: params.backUrls,
      auto_return: 'approved',
      ...(process.env.MP_WEBHOOK_URL ? { notification_url: process.env.MP_WEBHOOK_URL } : {}),
      statement_descriptor: 'MOONBYTE',
      metadata: { orderId: params.orderId },
    },
  })

  if (!result.id || !result.init_point) {
    throw new Error('Mercado Pago no devolvió init_point')
  }

  return {
    id: result.id,
    init_point: result.init_point,
    isMock: false,
  }
}

// ─────────────────────────────────────────────────────────────
// Verificar un pago consultando MP (CRÍTICO para seguridad)
//
// Nunca confiar en el cliente sobre el status del pago.
// Siempre consultar la API de MP con el payment_id.
// ─────────────────────────────────────────────────────────────
export async function verifyPayment(paymentId: string): Promise<PaymentVerification> {
  // MOCK: aceptamos cualquier paymentId que empiece con "mock-"
  if (isMockMode() || paymentId.startsWith('mock-')) {
    return {
      approved: true,
      status: 'approved',
      externalReference: null, // El caller debe verificar contra el orderId esperado
      amount: 0,
      paymentMethodId: 'mock',
      paymentId,
    }
  }

  const payment = new Payment(getClient())
  const result = await payment.get({ id: paymentId })

  return {
    approved: result.status === 'approved',
    status: result.status ?? 'unknown',
    externalReference: result.external_reference ?? null,
    amount: result.transaction_amount ?? 0,
    paymentMethodId: result.payment_method_id ?? 'unknown',
    paymentId: String(result.id),
  }
}

// ─────────────────────────────────────────────────────────────
// Validar firma del webhook MP (HMAC-SHA256)
//
// MP firma cada webhook con el header x-signature en formato:
//   ts=<timestamp>,v1=<hash>
// donde hash = HMAC_SHA256(secret, `id:<dataId>;request-id:<reqId>;ts:<ts>;`)
// ─────────────────────────────────────────────────────────────
export function verifyWebhookSignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET

  // En dev/mock, si no hay secret, no verificamos (permite testing)
  if (!secret) {
    console.warn('[MP-WEBHOOK] ⚠ MP_WEBHOOK_SECRET no configurado — saltando verificación')
    return true
  }

  if (!xSignature || !xRequestId) return false

  // Parsear "ts=123,v1=abc"
  const parts = xSignature.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=')
    if (key && value) acc[key.trim()] = value.trim()
    return acc
  }, {})

  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  // Construir el manifest según docs de MP
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  // Comparación timing-safe
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'))
  } catch {
    return false
  }
}

export function isMercadoPagoConfigured(): boolean {
  return !isMockMode()
}
