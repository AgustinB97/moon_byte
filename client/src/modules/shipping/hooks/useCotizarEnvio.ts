import { useState } from 'react'
import { shippingService } from '../services/shipping.service'
import type { CotizacionRequest, OpcionEnvio } from '../types/shipping.types'

export function useCotizarEnvio() {
  const [opcion, setOpcion] = useState<OpcionEnvio | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cotizar = async (params: CotizacionRequest): Promise<void> => {
    setLoading(true)
    setError(null)
    // NO limpiamos opcion aquí — mantenemos el valor anterior visible mientras carga.
    // Se sobreescribe cuando llega el resultado, o se borra si falla.
    try {
      const result = await shippingService.cotizar(params)
      setOpcion(result)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Tuvimos un problema al cotizar tu envío. Intentá de nuevo.')
      setOpcion(null) // solo borramos si falló
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setOpcion(null)
    setError(null)
  }

  return { cotizar, opcion, loading, error, reset }
}
