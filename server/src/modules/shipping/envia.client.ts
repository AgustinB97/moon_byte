import type { CotizarEnvioInput, DireccionEnvio, PaqueteEnvio, OpcionEnvio, CrearEtiquetaInput, EtiquetaCreada, TrackingResult } from './shipping.types'

// ── Errores tipados ──────────────────────────────────────────

export class EnviaApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'EnviaApiError'
  }
}

// ── Helpers internos ─────────────────────────────────────────

function getBaseUrl(): string {
  const raw = process.env.ENVIA_BASE_URL ?? 'https://api-test.envia.com'
  return raw.trim().replace(/\/$/, '') // elimina espacios y barra final
}

function getToken(): string {
  const token = process.env.ENVIA_TOKEN
  if (!token) throw new Error('[SHIPPING] ENVIA_TOKEN no está configurado en .env')
  return token
}

function getCarrier(): string {
  return process.env.ENVIA_CARRIER ?? 'andreani'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Cliente HTTP con retry y logging ────────────────────────

async function request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`
  const token = getToken()
  console.log(`[ENVIA] → ${method} ${url}`)
  console.log(`[ENVIA] token primeros 12: ${token.slice(0, 12)}...`)
  console.log(`[ENVIA] body: ${JSON.stringify(body).slice(0, 300)}`)
  const MAX_RETRIES = 3

  let lastError: Error = new Error('Error desconocido')

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const t0 = Date.now()

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })

      const elapsed = Date.now() - t0
      const retryTag = attempt > 1 ? ` (intento ${attempt})` : ''
      console.log(`[ENVIA] ${method} ${endpoint} → ${res.status} (${elapsed}ms)${retryTag}`)

      const rawText = await res.text()
      let data: unknown
      try {
        data = JSON.parse(rawText)
      } catch {
        data = { message: rawText }
      }

      console.log(`[ENVIA] response body: ${rawText.slice(0, 200)}`)

      // 4xx → error del cliente, no reintentar
      if (res.status >= 400 && res.status < 500) {
        const msg = (data as Record<string, unknown>)?.message as string | undefined
        throw new EnviaApiError(res.status, msg ?? rawText.slice(0, 120))
      }

      // 5xx → reintentar con backoff exponencial
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`)
        if (attempt < MAX_RETRIES) {
          await sleep(200 * 2 ** (attempt - 1)) // 200ms → 400ms
          continue
        }
        throw lastError
      }

      return data as T
    } catch (err) {
      if (err instanceof EnviaApiError) throw err
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_RETRIES) {
        await sleep(200 * 2 ** (attempt - 1))
        continue
      }
    }
  }

  throw lastError
}

// ── Códigos de provincias Argentina ──────────────────────────

const PROVINCIA_CODES: Record<string, string> = {
  'buenos aires': 'B',
  'ciudad autónoma de buenos aires': 'C',
  'caba': 'C',
  'catamarca': 'K',
  'chaco': 'H',
  'chubut': 'U',
  'córdoba': 'X',
  'cordoba': 'X',
  'corrientes': 'W',
  'entre ríos': 'E',
  'entre rios': 'E',
  'formosa': 'P',
  'jujuy': 'Y',
  'la pampa': 'L',
  'la rioja': 'F',
  'mendoza': 'M',
  'misiones': 'N',
  'neuquén': 'Q',
  'neuquen': 'Q',
  'río negro': 'R',
  'rio negro': 'R',
  'salta': 'A',
  'san juan': 'J',
  'san luis': 'D',
  'santa cruz': 'Z',
  'santa fe': 'S',
  'santiago del estero': 'G',
  'tierra del fuego': 'V',
  'tucumán': 'T',
  'tucuman': 'T',
}

function toProvinciaCode(provincia: string): string {
  // Si ya es un código corto (≤3 chars) lo devuelve directo
  if (provincia.trim().length <= 3) return provincia.trim().toUpperCase()
  return PROVINCIA_CODES[provincia.trim().toLowerCase()] ?? provincia.trim().slice(0, 3).toUpperCase()
}

// ── Mappers Envia.com ────────────────────────────────────────

function mapDireccion(d: DireccionEnvio): Record<string, unknown> {
  return {
    name: d.nombre,
    phone: d.telefono,
    ...(d.email ? { email: d.email } : {}),
    street: d.calle,
    number: d.altura ?? '0',
    ...(d.piso ? { floor: d.piso } : {}),
    ...(d.departamento ? { apartment: d.departamento } : {}),
    city: d.ciudad,
    state: toProvinciaCode(d.provincia),
    country: d.pais,
    postalCode: d.codigoPostal,
  }
}

function mapPaquete(p: PaqueteEnvio): Record<string, unknown> {
  return {
    type: p.tipo,
    content: p.contenido,
    amount: p.cantidad,
    declaredValue: p.valorDeclarado,
    lengthUnit: p.unidadLongitud,
    weightUnit: p.unidadPeso,
    weight: p.peso,
    dimensions: {
      length: p.dimensiones.largo,
      width: p.dimensiones.ancho,
      height: p.dimensiones.alto,
    },
  }
}

// ── API pública del cliente ──────────────────────────────────

interface EnviaRateItem {
  carrier?: string
  service?: string
  serviceDescription?: string
  totalPrice?: string
  currency?: string
  deliveryEstimate?: string
  deliveryDate?: { date: string; timeUnit: string; dateDifference: number } | null
}

interface EnviaRateResponse {
  meta?: string
  data?: EnviaRateItem[]
  error?: { code: number; message: string; description: string }
}

export async function cotizarEnvia(input: CotizarEnvioInput): Promise<OpcionEnvio[]> {
  const body = {
    origin: mapDireccion(input.origen),
    destination: mapDireccion(input.destino),
    packages: input.paquetes.map(mapPaquete),
    shipment: { type: 1, carrier: getCarrier() },
  }

  const result = await request<EnviaRateResponse>('POST', '/ship/rate/', body)

  if (result.meta === 'error') {
    throw new EnviaApiError(result.error?.code ?? 400, result.error?.message ?? 'Error en cotización')
  }

  return (result.data ?? []).map((item) => ({
    carrier: item.carrier ?? '',
    service: item.service ?? '',
    serviceDescription: item.serviceDescription ?? '',
    totalPrice: item.totalPrice ?? '0',
    currency: item.currency ?? 'ARS',
    deliveryEstimate: item.deliveryEstimate ?? '',
    deliveryDate: item.deliveryDate ?? null,
  }))
}

interface EnviaGenerateResponse {
  data?: {
    shipmentId?: number
    trackingNumber?: string
    label?: string
    carrier?: string
    totalPrice?: number
    currency?: string
  }
}

export async function crearEtiquetaEnvia(input: CrearEtiquetaInput): Promise<EtiquetaCreada> {
  const body = {
    origin: mapDireccion(input.origen),
    destination: mapDireccion(input.destino),
    packages: input.paquetes.map(mapPaquete),
    shipment: { type: 1, carrier: getCarrier(), service: input.service },
    settings: {
      currency: 'ARS',
      printFormat: 'PDF',
      printSize: 'STOCK_4X6',
    },
    reference: input.orderId,
  }

  const result = await request<EnviaGenerateResponse>('POST', '/ship/generate/', body)
  console.log('[ENVIA] generate response completo:', JSON.stringify(result, null, 2))
  const d = result.data ?? {}

  if (!d.shipmentId) {
    throw new EnviaApiError(500, 'Envia.com no devolvió shipmentId — la etiqueta puede no haberse creado')
  }

  return {
    shipmentId: d.shipmentId,
    trackingNumber: d.trackingNumber ?? '',
    labelUrl: d.label ?? '',
    carrier: d.carrier ?? getCarrier(),
    totalPrice: d.totalPrice ?? 0,
    currency: d.currency ?? 'ARS',
  }
}

export async function cancelarEnvia(shipmentId: number): Promise<void> {
  await request<unknown>('DELETE', `/ship/${shipmentId}/`)
}

interface EnviaTrackEvento {
  date?: string
  location?: string | null
  description?: string
}

interface EnviaTrackResponse {
  data?: {
    trackingNumber?: string
    status?: string
    carrier?: string
    checkpoints?: EnviaTrackEvento[]
  }
}

export async function trackingEnvia(trackingNumber: string): Promise<TrackingResult> {
  const result = await request<EnviaTrackResponse>('POST', '/ship/generaltrack/', {
    trackingNumbers: [trackingNumber],
  })

  const d = result.data ?? {}

  return {
    trackingNumber: d.trackingNumber ?? trackingNumber,
    status: d.status ?? 'unknown',
    carrier: d.carrier ?? getCarrier(),
    eventos: (d.checkpoints ?? []).map((c) => ({
      timestamp: c.date ?? '',
      location: c.location ?? null,
      description: c.description ?? '',
    })),
  }
}
