import api from '@/services/api'
import type { CotizacionRequest, OpcionEnvio, TrackingResult } from '../types/shipping.types'

export const shippingService = {
  cotizar: async (params: CotizacionRequest): Promise<OpcionEnvio> => {
    const { data } = await api.post<OpcionEnvio>('/shipping/cotizar', params)
    return data
  },

  tracking: async (trackingNumber: string): Promise<TrackingResult> => {
    const { data } = await api.post<TrackingResult>('/shipping/tracking', { trackingNumber })
    return data
  },
}
