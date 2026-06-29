import type { Request, Response } from 'express'
import { z } from 'zod'
import { cotizarEnvio, crearEtiqueta, obtenerTracking, solicitarCancelacion, confirmarCancelacion, ShippingError } from './shipping.service'
import type { DireccionEnvio, PaqueteEnvio } from './shipping.types'

// ── Schemas de validación ────────────────────────────────────

const paqueteEtiquetaSchema = z.object({
  contenido: z.string().min(1),
  pesoKg: z.number().positive(),
  largo: z.number().positive(),
  ancho: z.number().positive(),
  alto: z.number().positive(),
  valorDeclarado: z.number().nonnegative(),
})

const cotizarBodySchema = z.object({
  cpOrigen: z.string().min(4).max(8),
  cpDestino: z.string().min(4).max(8),
  pesoKg: z.number().positive(),
  largo: z.number().positive(),
  ancho: z.number().positive(),
  alto: z.number().positive(),
  valorDeclarado: z.number().nonnegative().default(0),
  contenido: z.string().min(1).default('Electrónica'),
})

const etiquetaBodySchema = z.object({
  orderId: z.string().min(1),
  cpOrigen: z.string().min(4).max(8),
  destinatario: z.object({
    nombre: z.string().min(1),
    telefono: z.string().min(6),
    email: z.string().email().optional(),
    calle: z.string().min(1),
    altura: z.string().optional(),
    ciudad: z.string().min(1),
    provincia: z.string().min(1),
    codigoPostal: z.string().min(4).max(8),
  }),
  paquetes: z.array(paqueteEtiquetaSchema).min(1),
  service: z.string().min(1),
})

const trackingBodySchema = z.object({
  trackingNumber: z.string().min(1),
})

// ── Helpers ──────────────────────────────────────────────────

function getOrigenDesdeEnv(cpOrigen: string): DireccionEnvio {
  return {
    nombre: process.env.ENVIA_ORIGEN_NOMBRE ?? 'MoonByte',
    telefono: process.env.ENVIA_ORIGEN_TELEFONO ?? '0000000000',
    calle: process.env.ENVIA_ORIGEN_CALLE ?? 'Sin calle',
    ciudad: process.env.ENVIA_ORIGEN_CIUDAD ?? 'Buenos Aires',
    provincia: process.env.ENVIA_ORIGEN_PROVINCIA ?? 'Buenos Aires',
    pais: 'AR',
    codigoPostal: cpOrigen,
  }
}

function paqueteToCotizacion(p: {
  contenido: string
  pesoKg: number
  largo: number
  ancho: number
  alto: number
  valorDeclarado: number
}): PaqueteEnvio {
  return {
    tipo: 'box',
    contenido: p.contenido,
    cantidad: 1,
    valorDeclarado: p.valorDeclarado,
    unidadLongitud: 'CM',
    unidadPeso: 'KG',
    peso: p.pesoKg,
    dimensiones: { largo: p.largo, ancho: p.ancho, alto: p.alto },
  }
}

// ── Handlers ─────────────────────────────────────────────────

export async function cotizar(req: Request, res: Response): Promise<void> {
  const parsed = cotizarBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors })
    return
  }

  const { cpOrigen, cpDestino, pesoKg, largo, ancho, alto, valorDeclarado, contenido } = parsed.data

  const result = await cotizarEnvio({
    origen: getOrigenDesdeEnv(cpOrigen),
    destino: {
      nombre: 'Destino',
      telefono: '0000000000',
      calle: '.',
      ciudad: '.',
      provincia: '.',
      pais: 'AR',
      codigoPostal: cpDestino,
    },
    paquetes: [paqueteToCotizacion({ contenido, pesoKg, largo, ancho, alto, valorDeclarado })],
  })

  res.json(result.opcion)
}

export async function generarEtiqueta(req: Request, res: Response): Promise<void> {
  const parsed = etiquetaBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors })
    return
  }

  const { orderId, cpOrigen, destinatario, paquetes, service } = parsed.data

  const destino: DireccionEnvio = {
    nombre: destinatario.nombre,
    telefono: destinatario.telefono,
    email: destinatario.email,
    calle: destinatario.calle,
    altura: destinatario.altura,
    ciudad: destinatario.ciudad,
    provincia: destinatario.provincia,
    pais: 'AR',
    codigoPostal: destinatario.codigoPostal,
  }

  const result = await crearEtiqueta({
    orderId,
    origen: getOrigenDesdeEnv(cpOrigen),
    destino,
    paquetes: paquetes.map((p) =>
      paqueteToCotizacion({ ...p, contenido: p.contenido })
    ),
    service,
  })

  res.status(201).json(result)
}

export async function tracking(req: Request, res: Response): Promise<void> {
  const parsed = trackingBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'trackingNumber es requerido' })
    return
  }

  const result = await obtenerTracking(parsed.data.trackingNumber)
  res.json(result)
}

/** POST /cancelar — admin solicita cancelación, envía mail de confirmación */
export async function cancelar(req: Request, res: Response): Promise<void> {
  const { orderId } = req.body as { orderId?: string }
  if (!orderId) {
    res.status(400).json({ message: 'orderId es requerido' })
    return
  }
  await solicitarCancelacion(orderId)
  res.json({ message: 'Solicitud enviada. Confirmá la cancelación desde el email.' })
}

/** GET /cancelar-confirmar/:token — link del email, ejecuta la cancelación real */
export async function confirmarCancelar(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  if (!token) {
    res.status(400).json({ message: 'Token inválido' })
    return
  }
  await confirmarCancelacion(token)
  res.json({ message: 'Envío cancelado correctamente en Envia.com' })
}

// ── Error handler específico de shipping ─────────────────────

export function handleShippingError(err: unknown, res: Response): boolean {
  if (err instanceof ShippingError) {
    res.status(422).json({ message: err.message })
    return true
  }
  return false
}
