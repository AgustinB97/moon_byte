/**
 * Cálculo de precios finales a partir del costo.
 *
 * Fórmulas (definidas por el negocio):
 *  - Markup base: 1.2 (20% de margen)
 *  - Sin Mercado Pago (efectivo / transferencia): / 0.945   (5.5% comisión)
 *  - Con Mercado Pago (tarjeta vía API):          / 0.883   (11.7% comisión MP)
 *
 * Devolvemos enteros (redondeo) porque los precios en ARS se manejan sin decimales.
 */

export const PRICING = {
  MARKUP: 1.2,
  DIVISOR_CASH: 0.945,
  DIVISOR_MP: 0.883,
} as const

export interface CalculatedPrices {
  priceWithMP: number   // Con tarjeta vía Mercado Pago
  priceCash: number     // Efectivo / transferencia
  /** Diferencia porcentual entre cash y MP — útil para mostrar el descuento al cliente */
  cashDiscountPercent: number
}

export function calculatePrices(cost: number): CalculatedPrices {
  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error(`Costo inválido: ${cost}`)
  }

  const base = cost * PRICING.MARKUP
  const priceWithMP = Math.round(base / PRICING.DIVISOR_MP)
  const priceCash = Math.round(base / PRICING.DIVISOR_CASH)

  // % de descuento que el cliente recibe al pagar en efectivo vs MP
  const cashDiscountPercent =
    priceWithMP > 0 ? Math.round(((priceWithMP - priceCash) / priceWithMP) * 100) : 0

  return { priceWithMP, priceCash, cashDiscountPercent }
}

/**
 * Reverse: dado un precio final (asumiendo que es el de MP), calcula
 * cuál fue el costo aproximado. Útil para el seed cuando los productos
 * existentes solo tienen `price`.
 */
export function reverseCalculateCost(priceWithMP: number): number {
  return Math.round((priceWithMP * PRICING.DIVISOR_MP) / PRICING.MARKUP)
}
