import 'dotenv/config'
import mongoose from 'mongoose'
import { User } from '../models/User'
import { Product } from '../models/Product'
import { calculatePrices } from '../utils/pricing'

const ADMIN = {
  name: 'Admin MoonByte',
  email: 'admin@moonbyte.ar',
  password: 'admin12345',
  role: 'admin' as const,
  emailVerified: true,
}

const DEMO_USER = {
  name: 'Juan García',
  email: 'juan@test.com',
  password: 'test1234',
  role: 'user' as const,
  emailVerified: true,
}

/**
 * Productos de seed con `cost` (lo que pagamos por cada uno).
 * Los precios finales (con/sin MP) se calculan automáticamente.
 */
const PRODUCTS_SEED = [
  {
    name: 'MoonByte Vega — PC Gamer RTX 4070 / Ryzen 7',
    slug: 'moonbyte-vega-rtx4070-r7',
    description: 'PC armada gamer de alto rendimiento. AMD Ryzen 7 7700X, RTX 4070 12GB, 32GB DDR5, SSD 1TB NVMe.',
    cost: 1361000, // ≈ $1.850.000 final MP
    comparePrice: 2100000,
    images: ['https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&q=80'],
    category: 'pcs-armadas',
    brand: 'MoonByte',
    stock: 5,
    rating: 4.9,
    reviewCount: 134,
    tags: ['pc armada', 'gaming', 'rtx 4070'],
    specs: { CPU: 'Ryzen 7 7700X', GPU: 'RTX 4070 12GB', RAM: '32GB DDR5', Storage: 'SSD 1TB NVMe' },
    featured: true,
  },
  {
    name: 'MoonByte Apex — PC Workstation RTX 4090',
    slug: 'moonbyte-apex-rtx4090',
    description: 'La build definitiva. Intel Core i9-14900K, RTX 4090 24GB, 64GB DDR5, 2TB NVMe.',
    cost: 2906000, // ≈ $3.950.000 final MP
    comparePrice: 4500000,
    images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80'],
    category: 'pcs-armadas',
    brand: 'MoonByte',
    stock: 2,
    rating: 5.0,
    reviewCount: 43,
    tags: ['pc armada', 'workstation', 'rtx 4090'],
    specs: { CPU: 'i9-14900K', GPU: 'RTX 4090 24GB', RAM: '64GB DDR5', Storage: '2TB NVMe' },
    featured: true,
  },
  {
    name: 'AMD Ryzen 9 7950X — 16 Núcleos 4.5GHz',
    slug: 'amd-ryzen-9-7950x',
    description: 'Procesador tope de gama para workstations y streaming.',
    cost: 382500, // ≈ $520.000 final MP
    comparePrice: 610000,
    images: ['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80'],
    category: 'procesadores',
    brand: 'AMD',
    stock: 12,
    rating: 4.9,
    reviewCount: 312,
    tags: ['cpu', 'amd', 'ryzen'],
    specs: { Núcleos: '16', Hilos: '32', Base: '4.5GHz', Boost: '5.7GHz' },
    featured: true,
  },
  {
    name: 'NVIDIA GeForce RTX 4080 Super 16GB',
    slug: 'rtx-4080-super-16gb',
    description: 'GPU flagship para gaming 4K y ray tracing extremo.',
    cost: 971000, // ≈ $1.320.000 final MP
    comparePrice: 1500000,
    images: ['https://images.unsplash.com/photo-1640955014216-75201056c829?w=600&q=80'],
    category: 'placas-de-video',
    brand: 'ASUS ROG',
    stock: 4,
    rating: 4.8,
    reviewCount: 201,
    tags: ['gpu', 'nvidia'],
    specs: { VRAM: '16GB GDDR6X', CUDA: '10240', TDP: '320W' },
    featured: true,
  },
  {
    name: 'Samsung 990 Pro 2TB NVMe PCIe 4.0',
    slug: 'samsung-990-pro-2tb',
    description: 'SSD NVMe ultra-rápido con velocidades de hasta 7450 MB/s.',
    cost: 143500, // ≈ $195.000 final MP
    comparePrice: 240000,
    images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80'],
    category: 'almacenamiento',
    brand: 'Samsung',
    stock: 15,
    rating: 4.9,
    reviewCount: 678,
    tags: ['ssd', 'nvme'],
    specs: { Capacidad: '2TB', Lectura: '7450 MB/s', Escritura: '6900 MB/s' },
    featured: true,
  },
]

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('[SEED] MONGODB_URI no está configurado')
    process.exit(1)
  }

  console.log('[SEED] Conectando a MongoDB...')
  await mongoose.connect(process.env.MONGODB_URI)

  console.log('[SEED] Limpiando colecciones...')
  await User.deleteMany({})
  await Product.deleteMany({})

  console.log('[SEED] Creando usuarios...')
  await User.create(ADMIN)
  await User.create(DEMO_USER)

  console.log('[SEED] Creando productos (con precios calculados desde cost)...')
  const productsWithPrices = PRODUCTS_SEED.map((p) => {
    const { priceWithMP, priceCash } = calculatePrices(p.cost)
    return {
      ...p,
      price: priceWithMP,
      priceCash,
      status: 'active' as const,
    }
  })
  await Product.insertMany(productsWithPrices)

  console.log('')
  console.log('  ════════════════════════════════════════')
  console.log('  ✓ Seed completado')
  console.log('  ════════════════════════════════════════')
  console.log('  Admin:  admin@moonbyte.ar  /  admin12345')
  console.log('  User:   juan@test.com      /  test1234')
  console.log(`  Productos cargados: ${PRODUCTS_SEED.length} (todos en status=active)`)
  console.log('')
  console.log('  Precios calculados:')
  productsWithPrices.slice(0, 3).forEach((p) => {
    const cash = p.priceCash.toLocaleString('es-AR')
    const mp = p.price.toLocaleString('es-AR')
    const cost = p.cost.toLocaleString('es-AR')
    console.log(`    ${p.slug.padEnd(30)} cost $${cost}  →  efectivo $${cash}  |  MP $${mp}`)
  })
  console.log('  ════════════════════════════════════════')
  console.log('')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('[SEED] Error:', err)
  process.exit(1)
})
