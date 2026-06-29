/**
 * Cálculo de precios cliente-side (espejo del backend).
 *
 * MANTENER SINCRONIZADO con server/src/utils/pricing.ts
 *
 * Para la calculadora del admin en tiempo real — el cálculo real (autoritativo)
 * lo hace el backend al guardar; este helper es solo para preview live.
 */

export const PRICING = {
  MARKUP: 1.2,
  DIVISOR_CASH: 0.945,
  DIVISOR_MP: 0.883,
} as const

export interface CalculatedPrices {
  priceWithMP: number
  priceCash: number
  cashDiscountPercent: number
}

export function calculatePrices(cost: number): CalculatedPrices {
  if (!Number.isFinite(cost) || cost < 0) {
    return { priceWithMP: 0, priceCash: 0, cashDiscountPercent: 0 }
  }

  const base = cost * PRICING.MARKUP
  const priceWithMP = Math.round(base / PRICING.DIVISOR_MP)
  const priceCash = Math.round(base / PRICING.DIVISOR_CASH)

  const cashDiscountPercent =
    priceWithMP > 0 ? Math.round(((priceWithMP - priceCash) / priceWithMP) * 100) : 0

  return { priceWithMP, priceCash, cashDiscountPercent }
}
