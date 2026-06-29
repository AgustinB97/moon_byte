import type { Request, Response } from 'express'

interface CotizarBody {
  cpOrigen: string
  cpDestino: string
  pesoKg: number
  largo: number
  ancho: number
  alto: number
  valorDeclarado: number
  contenido?: string
}

export async function cotizarEnvio(req: Request, res: Response): Promise<void> {
  const { cpOrigen, cpDestino, pesoKg, largo, ancho, alto, valorDeclarado } =
    req.body as CotizarBody

  // Validaciones básicas
  if (!cpOrigen || !cpDestino) {
    res.status(400).json({ message: 'cpOrigen y cpDestino son requeridos' })
    return
  }
  if (String(cpDestino).length !== 4) {
    res.status(400).json({ message: 'cpDestino debe tener 4 dígitos' })
    return
  }
  if (!pesoKg || pesoKg <= 0) {
    res.status(400).json({ message: 'pesoKg debe ser mayor a 0' })
    return
  }
  if (!largo || !ancho || !alto) {
    res.status(400).json({ message: 'largo, ancho y alto son requeridos' })
    return
  }

  // Sin API key de Andreani → mock
  if (!process.env.ANDREANI_API_KEY) {
    res.json(mockOpcion(pesoKg, valorDeclarado ?? 0))
    return
  }

  // TODO: integrar con API real de Andreani
  res.json(mockOpcion(pesoKg, valorDeclarado ?? 0))
}

/** Devuelve una OpcionEnvio simulada escalada por peso y valor declarado */
function mockOpcion(pesoKg: number, valorDeclarado: number) {
  const base = 2500
  const porPeso = Math.ceil(pesoKg) * 350
  const porValor = Math.round(valorDeclarado * 0.005) // 0.5% del valor declarado
  const totalPrice = base + porPeso + porValor

  return {
    carrier: 'andreani',
    service: 'AND_ESTANDAR',
    serviceDescription: 'Andreani Estándar a domicilio',
    totalPrice: totalPrice.toFixed(2),
    currency: 'ARS',
    deliveryEstimate: pesoKg <= 5 ? '3-5 días hábiles' : '5-8 días hábiles',
  }
}
