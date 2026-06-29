// ── Dirección ──────────────────────────────────────────────
export interface DireccionEnvio {
  nombre: string
  telefono: string
  calle: string
  ciudad: string
  provincia: string
  pais: 'AR'
  codigoPostal: string
  email?: string
  altura?: string
  piso?: string
  departamento?: string
}

// ── Paquete ─────────────────────────────────────────────────
export interface PaqueteEnvio {
  tipo: 'box' | 'envelope'
  contenido: string
  cantidad: number
  valorDeclarado: number
  unidadLongitud: 'CM'
  unidadPeso: 'KG'
  peso: number
  dimensiones: {
    largo: number
    ancho: number
    alto: number
  }
}

// ── Cotización ──────────────────────────────────────────────
export interface CotizarEnvioInput {
  origen: DireccionEnvio
  destino: DireccionEnvio
  paquetes: PaqueteEnvio[]
}

export interface OpcionEnvio {
  carrier: string
  service: string
  serviceDescription: string
  totalPrice: string
  currency: string
  deliveryEstimate: string
  deliveryDate: {
    date: string
    timeUnit: string
    dateDifference: number
  } | null
}

export interface CotizacionResult {
  opcion: OpcionEnvio
}

// ── Etiqueta ─────────────────────────────────────────────────
export interface CrearEtiquetaInput {
  orderId: string
  origen: DireccionEnvio
  destino: DireccionEnvio
  paquetes: PaqueteEnvio[]
  service: string
}

export interface EtiquetaCreada {
  shipmentId: number
  trackingNumber: string
  labelUrl: string
  carrier: string
  totalPrice: number
  currency: string
}

// ── Tracking ─────────────────────────────────────────────────
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

// ── Estado MongoDB ───────────────────────────────────────────
export type EstadoEnvio = 'pending' | 'in_transit' | 'delivered' | 'failed'
