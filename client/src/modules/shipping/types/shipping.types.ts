export interface OpcionEnvio {
  carrier: string
  service: string
  serviceDescription: string
  totalPrice: string
  currency: string
  deliveryEstimate: string
}

export interface CotizacionRequest {
  cpOrigen: string
  cpDestino: string
  pesoKg: number
  largo: number
  ancho: number
  alto: number
  valorDeclarado: number
  contenido: string
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

export type EstadoEnvio = 'pending' | 'in_transit' | 'delivered' | 'failed'
