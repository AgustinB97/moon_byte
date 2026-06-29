export interface DireccionCliente {
  street: string
  city: string
  state: string
  postalCode: string
  country?: string
}

export interface ProductoDimensiones {
  pesoEmbalado: number  // gramos
  alto: number          // cm
  ancho: number         // cm
  largo: number         // cm
  quantity: number
}

export interface PayloadEnvio {
  origen: string
  destino: DireccionCliente
  paquete: {
    peso: number   // gramos totales
    alto: number   // cm — el máximo entre todos los paquetes
    ancho: number  // cm — el máximo entre todos los paquetes
    largo: number  // cm — suma (los paquetes se apilan)
  }
}

export function buildEnvioPayload(
  destino: DireccionCliente,
  productos: ProductoDimensiones[]
): PayloadEnvio {
  const origen = process.env.DIRECCION_ORIGEN
  if (!origen) throw new Error('[ENVIOS] DIRECCION_ORIGEN no está configurado en .env')

  let totalPeso = 0
  let maxAlto = 0
  let maxAncho = 0
  let sumLargo = 0

  for (const p of productos) {
    totalPeso += p.pesoEmbalado * p.quantity
    maxAlto = Math.max(maxAlto, p.alto)
    maxAncho = Math.max(maxAncho, p.ancho)
    sumLargo += p.largo * p.quantity
  }

  return {
    origen,
    destino,
    paquete: {
      peso: totalPeso,
      alto: maxAlto,
      ancho: maxAncho,
      largo: sumLargo,
    },
  }
}
