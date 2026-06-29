import { useState, useEffect } from 'react'
import { shippingService } from '../services/shipping.service'
import type { TrackingResult } from '../types/shipping.types'

export function useTracking(initialTracking?: string) {
  const [resultado, setResultado] = useState<TrackingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buscar = async (nro: string): Promise<void> => {
    if (!nro.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await shippingService.tracking(nro.trim())
      setResultado(result)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'No encontramos ese número de seguimiento.')
      setResultado(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialTracking) void buscar(initialTracking)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { buscar, resultado, loading, error }
}
