import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDiscount(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '…'
}

export const CATEGORY_LABELS: Record<string, string> = {
  'pcs-armadas': 'PCs Armadas',
  procesadores: 'Procesadores',
  'placas-de-video': 'Placas de Video',
  'memorias-ram': 'Memorias RAM',
  almacenamiento: 'Almacenamiento',
  'placas-madre': 'Placas Madre',
  gabinetes: 'Gabinetes',
  refrigeracion: 'Refrigeración',
  fuentes: 'Fuentes',
  monitores: 'Monitores',
  perifericos: 'Periféricos',
}
