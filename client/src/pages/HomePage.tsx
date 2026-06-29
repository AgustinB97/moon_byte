import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Moon, Shield, Truck, Cpu, ChevronRight, Zap } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { ProductCard } from '@/components/features/ProductCard'
import { SpecMarquee } from '@/components/features/SpecMarquee'
import { TelemetryPanel } from '@/components/features/TelemetryPanel'
import { getFeaturedProducts } from '@/services/products'
import { formatCurrency, formatDiscount, cn } from '@/utils'
import { calculatePrices } from '@/utils/pricing'
import type { Product, ProductCategory } from '@/types'

// Mocks crudos sin cost — los enriquecemos abajo
const _RAW_MOCKS: Omit<Product, 'cost' | 'priceCash'>[] = [
  {
    _id: '1a2b3c',
    name: 'MoonByte Vega — PC Gamer RTX 4070 / Ryzen 7',
    slug: 'moonbyte-vega-rtx4070-r7',
    description: 'PC armada gamer de alto rendimiento. AMD Ryzen 7 7700X, RTX 4070 12GB, 32GB DDR5, SSD 1TB NVMe.',
    price: 1850000,
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
    createdAt: new Date().toISOString(),
  },
  {
    _id: '2b3c4d',
    name: 'MoonByte Nova — PC Office / Creator i5-14600K',
    slug: 'moonbyte-nova-i5-14600k',
    description: 'Workstation compacta para trabajo y creación de contenido.',
    price: 780000,
    images: ['https://images.unsplash.com/photo-1593640408182-31c228d9b0a8?w=600&q=80'],
    category: 'pcs-armadas',
    brand: 'MoonByte',
    stock: 8,
    rating: 4.7,
    reviewCount: 89,
    tags: ['pc armada', 'office', 'creator'],
    specs: { CPU: 'i5-14600K', RAM: '16GB DDR5', Storage: '512GB SSD' },
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: '3c4d5e',
    name: 'AMD Ryzen 9 7950X — 16 Núcleos 4.5GHz',
    slug: 'amd-ryzen-9-7950x',
    description: 'Procesador tope de gama. 16 núcleos, 32 hilos, hasta 5.7GHz boost.',
    price: 520000,
    comparePrice: 610000,
    images: ['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80'],
    category: 'procesadores',
    brand: 'AMD',
    stock: 12,
    rating: 4.9,
    reviewCount: 312,
    tags: ['cpu', 'amd', 'ryzen'],
    specs: { Núcleos: '16', Hilos: '32', 'Base': '4.5GHz', 'Boost': '5.7GHz' },
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: '4d5e6f',
    name: 'NVIDIA GeForce RTX 4080 Super 16GB',
    slug: 'rtx-4080-super-16gb',
    description: 'GPU flagship para gaming 4K y ray tracing extremo.',
    price: 1320000,
    comparePrice: 1500000,
    images: ['https://images.unsplash.com/photo-1640955014216-75201056c829?w=600&q=80'],
    category: 'placas-de-video',
    brand: 'ASUS ROG',
    stock: 4,
    rating: 4.8,
    reviewCount: 201,
    tags: ['gpu', 'nvidia', 'rtx 4080'],
    specs: { VRAM: '16GB GDDR6X', 'CUDA': '10240', TDP: '320W' },
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: '5e6f7g',
    name: 'Kingston Fury Beast 32GB DDR5 6000MHz',
    slug: 'kingston-fury-beast-32gb-ddr5',
    description: 'Kit de memorias DDR5 de alta frecuencia con RGB.',
    price: 185000,
    comparePrice: 220000,
    images: ['https://images.unsplash.com/photo-1562976540-1502c2145851?w=600&q=80'],
    category: 'memorias-ram',
    brand: 'Kingston',
    stock: 20,
    rating: 4.7,
    reviewCount: 445,
    tags: ['ram', 'ddr5', 'kingston'],
    specs: { Capacidad: '32GB', Frecuencia: '6000MHz', Latencia: 'CL36' },
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: '6f7g8h',
    name: 'Samsung 990 Pro 2TB NVMe PCIe 4.0',
    slug: 'samsung-990-pro-2tb',
    description: 'SSD NVMe ultra-rápido con velocidades de hasta 7450 MB/s.',
    price: 195000,
    comparePrice: 240000,
    images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80'],
    category: 'almacenamiento',
    brand: 'Samsung',
    stock: 15,
    rating: 4.9,
    reviewCount: 678,
    tags: ['ssd', 'nvme', 'samsung'],
    specs: { Capacidad: '2TB', Lectura: '7450 MB/s', Escritura: '6900 MB/s' },
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: '7g8h9i',
    name: 'LG UltraGear 27" OLED 240Hz QHD',
    slug: 'lg-ultragear-27-oled-240hz',
    description: 'Monitor gaming OLED 1ms, 240Hz, QHD 2560x1440.',
    price: 890000,
    comparePrice: 1050000,
    images: ['https://images.unsplash.com/photo-1527443224154-c4a573d8d53e?w=600&q=80'],
    category: 'monitores',
    brand: 'LG',
    stock: 6,
    rating: 4.8,
    reviewCount: 167,
    tags: ['monitor', 'oled', 'gaming'],
    specs: { Panel: 'OLED', Resolución: '2560x1440', Refresh: '240Hz' },
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: '8h9i0j',
    name: 'MoonByte Apex — PC Workstation RTX 4090',
    slug: 'moonbyte-apex-rtx4090',
    description: 'La build definitiva. Intel Core i9-14900K, RTX 4090 24GB, 64GB DDR5, 2TB NVMe.',
    price: 3950000,
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
    createdAt: new Date().toISOString(),
  },
]

// Reverse-calc cost desde price, después aplica calculatePrices para tener priceCash coherente
const MOCK_PRODUCTS: Product[] = _RAW_MOCKS.map((p) => {
  const approxCost = Math.round((p.price * 0.883) / 1.2)
  const { priceWithMP, priceCash } = calculatePrices(approxCost)
  return { ...p, cost: approxCost, price: priceWithMP, priceCash }
})

const CATEGORIES: { id: ProductCategory; label: string; icon: string; count: number; hot?: boolean }[] = [
  { id: 'pcs-armadas', label: 'PCs Armadas', icon: '🖥️', count: 24, hot: true },
  { id: 'procesadores', label: 'Procesadores', icon: '⚡', count: 38 },
  { id: 'placas-de-video', label: 'Placas de Video', icon: '🎮', count: 45, hot: true },
  { id: 'memorias-ram', label: 'Memorias RAM', icon: '💾', count: 61 },
  { id: 'almacenamiento', label: 'Almacenamiento', icon: '💿', count: 53 },
  { id: 'placas-madre', label: 'Placas Madre', icon: '🔌', count: 42 },
  { id: 'monitores', label: 'Monitores', icon: '🖱️', count: 29 },
  { id: 'perifericos', label: 'Periféricos', icon: '⌨️', count: 74 },
]

function useIntersection(ref: React.RefObject<Element>) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return visible
}

export function HomePage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  const featuredRef = useRef<HTMLDivElement>(null!)
  const categoriesRef = useRef<HTMLDivElement>(null!)
  const buildsRef = useRef<HTMLDivElement>(null!)
  const featuredVisible = useIntersection(featuredRef)
  const categoriesVisible = useIntersection(categoriesRef)
  const buildsVisible = useIntersection(buildsRef)

  useEffect(() => {
    getFeaturedProducts()
      .then(setProducts)
      .catch(() => setProducts(MOCK_PRODUCTS))
  }, [])

  const pcsArmadas = products.filter((p) => p.category === 'pcs-armadas')
  const componentes = products.filter((p) => p.category !== 'pcs-armadas').slice(0, 4)
  const heroBuild = pcsArmadas.find((p) => p.slug === 'moonbyte-apex-rtx4090') ?? pcsArmadas[0]
  const sideBuilds = pcsArmadas.filter((p) => p._id !== heroBuild?._id).slice(0, 2)

  return (
    <main className="min-h-[100dvh]">
      {/* ═══════════════════════════════════════════════════════════════
          HERO — Cinematográfico con telemetría HUD
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex flex-col justify-end overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=1600&q=80"
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/85 to-surface/30" />
          <div className="absolute inset-0 scanlines opacity-20" />
        </div>

        {/* Atmospheric mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[15%] w-[600px] h-[600px] rounded-full bg-gold/[0.07] blur-[120px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-gold/[0.04] blur-[100px]" />
        </div>

        <div className="absolute inset-0 grid-line opacity-[0.035] pointer-events-none" />

        {/* Top status bar */}
        <div className="absolute top-20 left-0 right-0 border-b border-steel/10">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gold animate-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-steel/60">
                  Sistema Online
                </span>
              </span>
              <span className="hidden md:block font-mono text-[9px] text-steel/25">///</span>
              <span className="hidden md:block font-mono text-[9px] uppercase tracking-widest text-steel/40">
                +500 Builds disponibles
              </span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-steel/30">
              MB-CORE-01 — ARG
            </span>
          </div>
        </div>

        {/* Hero body — split layout */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-16 md:pb-24 w-full grid md:grid-cols-12 gap-8 items-end">
          {/* Left — Title block */}
          <div className="md:col-span-8">
            <Badge variant="gold" className="mb-6 animate-reveal">
              <Moon size={8} className="mr-1" fill="currentColor" />
              MoonByte — PC Hardware Store
            </Badge>

            <h1 className="font-display text-[clamp(2.75rem,9.5vw,7.5rem)] leading-[0.88] tracking-tightest uppercase text-ash animate-reveal-delay-1 mb-4">
              Tu Próxima
              <br />
              <span className="text-gold relative">
                PC Armada
                {/* Decorative bracket markers */}
                <span className="absolute -left-4 md:-left-6 top-1 font-mono text-gold/40 text-xs">[</span>
                <span className="absolute -right-4 md:-right-6 top-1 font-mono text-gold/40 text-xs">]</span>
              </span>
              <br />
              <span className="text-ash/40">Te Espera</span>
            </h1>

            <p className="font-mono text-sm text-steel uppercase tracking-wide max-w-md mb-8 animate-reveal-delay-2">
              PCs gamer y workstation armadas por expertos. Componentes top. Garantía oficial.
            </p>

            <div className="flex flex-wrap gap-3 animate-reveal-delay-3">
              <Link to="/productos?category=pcs-armadas">
                <Button size="lg" className="group">
                  Ver PCs Armadas
                  <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight size={14} />
                  </span>
                </Button>
              </Link>
              <Link to="/productos">
                <Button variant="outline" size="lg">
                  Explorar Componentes
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-12 pt-8 border-t border-steel/20 grid grid-cols-3 gap-4 max-w-lg animate-reveal-delay-3">
              {[
                { value: '+500', label: 'Builds' },
                { value: '24hs', label: 'Despacho' },
                { value: '12x', label: 'Sin Interés' },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col">
                  <span className="font-display text-2xl text-gold tracking-tightest">{value}</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-steel/50">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Telemetry HUD */}
          <div className="md:col-span-4 hidden md:block">
            <TelemetryPanel />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <div className="w-px h-8 bg-gradient-to-b from-gold to-transparent animate-pulse" />
          <span className="font-mono text-[8px] uppercase tracking-widest text-steel">Scroll</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SPEC MARQUEE — Strip de specs running
          ═══════════════════════════════════════════════════════════════ */}
      <SpecMarquee speed="medium" />

      {/* ── VALUE PROPS ── */}
      <section className="border-b border-steel/20 bg-surface-dark/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, label: 'Envío en 24hs', desc: 'A todo el país' },
              { icon: Shield, label: 'Garantía Oficial', desc: 'Todos los componentes' },
              { icon: Zap, label: '12 Cuotas', desc: 'Sin interés' },
              { icon: Cpu, label: 'Armado Profesional', desc: 'Testeado antes de enviar' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-gold" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-ash">{label}</p>
                  <p className="font-mono text-[9px] text-steel/50 uppercase tracking-widest">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PCs ARMADAS — Layout asimétrico (hero card + 2 stacked)
          ═══════════════════════════════════════════════════════════════ */}
      <section ref={buildsRef} className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className={cn(
          'mb-10 flex items-end justify-between transition-all duration-700',
          buildsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        )}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
              [ Nuestras Builds ]
            </p>
            <h2 className="font-display text-[clamp(2rem,5vw,4rem)] uppercase tracking-tightest text-ash">
              PCs Armadas
              <br />
              <span className="text-gold">por Expertos</span>
            </h2>
          </div>
          <Link
            to="/productos?category=pcs-armadas"
            className="hidden md:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-colors group"
          >
            Ver todas
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-steel/10">
          {/* HERO BUILD — col-span-7 */}
          {heroBuild && (
            <Link
              to={`/productos/${heroBuild.slug}`}
              className={cn(
                'md:col-span-7 group relative flex flex-col bg-surface-mid overflow-hidden',
                'transition-all duration-700',
                buildsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              )}
            >
              {/* Image */}
              <div className="relative aspect-[16/10] md:aspect-[16/12] overflow-hidden bg-surface-dark">
                <img
                  src={heroBuild.images[0]}
                  alt={heroBuild.name}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-mid via-surface-mid/20 to-transparent" />

                {/* Top-left badge stack */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                  <Badge variant="gold">
                    <Zap size={8} className="mr-1" fill="currentColor" />
                    Top Pick
                  </Badge>
                  {heroBuild.comparePrice && (
                    <Badge variant="steel">
                      −{formatDiscount(heroBuild.comparePrice, heroBuild.price)}%
                    </Badge>
                  )}
                </div>

                {/* Crosshair corners */}
                <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-gold/60" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-gold/60" />

                {/* Specs overlay (bottom) */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-2">
                    [ Build Destacada ]
                  </p>
                  <h3 className="font-display text-2xl md:text-4xl uppercase tracking-tightest text-ash leading-[0.95] mb-4">
                    {heroBuild.name.split('—')[0]?.trim()}
                  </h3>

                  {/* Spec chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {Object.entries(heroBuild.specs).slice(0, 4).map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-ash/80 border border-steel/30 bg-surface-dark/40 backdrop-blur-sm px-2 py-1"
                      >
                        <span className="text-gold/70">{k}</span>
                        <span className="text-steel/40">:</span>
                        <span>{v}</span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-steel/60">Desde</span>
                      <p className="font-mono text-2xl md:text-3xl text-gold">
                        {formatCurrency(heroBuild.price)}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ash flex items-center gap-1.5 group-hover:gap-3 transition-all duration-300">
                      Ver Build
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* SIDE BUILDS — col-span-5, 2 stacked */}
          <div className="md:col-span-5 grid grid-rows-2 gap-px bg-steel/10">
            {sideBuilds.map((build, i) => (
              <Link
                key={build._id}
                to={`/productos/${build.slug}`}
                className={cn(
                  'group relative flex items-stretch bg-surface-mid overflow-hidden',
                  'transition-all duration-700',
                  buildsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                )}
                style={{ transitionDelay: `${(i + 1) * 120}ms` }}
              >
                {/* Image */}
                <div className="relative w-2/5 overflow-hidden bg-surface-dark">
                  <img
                    src={build.images[0]}
                    alt={build.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-mid/40" />
                </div>

                {/* Info */}
                <div className="flex-1 p-4 md:p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-steel mb-1">
                      {build.brand}
                    </p>
                    <h3 className="font-sans text-sm md:text-base font-semibold text-ash group-hover:text-gold transition-colors duration-200 line-clamp-2 leading-tight">
                      {build.name.split('—')[0]?.trim()}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.values(build.specs).slice(0, 2).map((v, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-[8px] uppercase tracking-widest text-steel/60 border border-steel/20 px-1.5 py-0.5"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-widest text-steel/50">
                        Desde
                      </span>
                      <p className="font-mono text-lg text-gold leading-none mt-0.5">
                        {formatCurrency(build.price)}
                      </p>
                    </div>
                    <ArrowRight size={12} className="text-steel/40 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Hover gold line */}
                <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full bg-gold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 flex md:hidden justify-center">
          <Link to="/productos?category=pcs-armadas">
            <Button variant="outline" size="md">Ver todas las builds</Button>
          </Link>
        </div>
      </section>

      {/* ── CATEGORÍAS ── */}
      <section ref={categoriesRef} className="max-w-7xl mx-auto px-4 pb-16 md:pb-24">
        <div className={cn(
          'mb-10 transition-all duration-700',
          categoriesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        )}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
            [ Componentes ]
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,4rem)] uppercase tracking-tightest text-ash">
            Armá tu
            <br />
            <span className="text-gold">Propia Build</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-steel/10">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/productos?category=${cat.id}`}
              className={cn(
                'group flex flex-col gap-3 p-5 bg-surface hover:bg-surface-mid',
                'border border-transparent hover:border-gold/20',
                'transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]',
                categoriesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{cat.icon}</span>
                {cat.hot && <Badge variant="gold">Hot</Badge>}
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-ash group-hover:text-gold transition-colors duration-200">
                  {cat.label}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-steel/40 mt-0.5">
                  {cat.count} productos
                </p>
              </div>
              <ChevronRight
                size={14}
                className="text-steel/30 group-hover:text-gold group-hover:translate-x-1 transition-all duration-200 self-end mt-auto"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ── COMPONENTES DESTACADOS ── */}
      <section ref={featuredRef} className="max-w-7xl mx-auto px-4 pb-16 md:pb-24">
        <div className={cn(
          'mb-10 flex items-end justify-between transition-all duration-700',
          featuredVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        )}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
              [ Componentes ]
            </p>
            <h2 className="font-display text-[clamp(2rem,5vw,4rem)] uppercase tracking-tightest text-ash">
              Lo Más
              <br />
              <span className="text-gold">Vendido</span>
            </h2>
          </div>
          <Link
            to="/productos"
            className="hidden md:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-colors group"
          >
            Ver todo
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-steel/10">
          {componentes.map((product, i) => (
            <div
              key={product._id}
              className={cn(
                'transition-all duration-700',
                featuredVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <ProductCard product={product} className="h-full" />
            </div>
          ))}
        </div>
      </section>

      {/* ── BRAND MARQUEE (reverse) ── */}
      <SpecMarquee
        items={['AMD', 'INTEL', 'NVIDIA', 'ASUS ROG', 'MSI', 'GIGABYTE', 'SAMSUNG', 'KINGSTON', 'CORSAIR', 'NZXT', 'COOLER MASTER', 'LIAN LI']}
        speed="slow"
        reverse
      />

      {/* ── CTA BANNER ── */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="relative overflow-hidden border border-gold/20 bg-surface-mid p-8 md:p-14">
          <div className="absolute inset-0 grid-line opacity-[0.03]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          {/* Decorative glow */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold/[0.08] blur-[100px]" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <Badge variant="gold" className="mb-4">🔥 Build del mes</Badge>
              <h2 className="font-display text-[clamp(2rem,5vw,4rem)] uppercase tracking-tightest text-ash">
                MoonByte Vega
                <br />
                <span className="text-gold">RTX 4070</span>
                <br />
                + Envío Gratis
              </h2>
              <p className="font-mono text-[11px] uppercase tracking-widest text-steel mt-3">
                Stock limitado · Armado y testeado en 48hs
              </p>
            </div>
            <Link to="/productos/moonbyte-vega-rtx4070-r7">
              <Button size="lg" className="group whitespace-nowrap">
                Ver Build
                <span className="ml-auto w-7 h-7 bg-surface-dark/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                  <ArrowRight size={12} />
                </span>
              </Button>
            </Link>
          </div>

          <div className="absolute bottom-4 right-8 font-mono text-[9px] text-steel/15 uppercase tracking-widest">
            UNIT / MB-2026 /// BUILD-VEGA-01
          </div>
        </div>
      </section>
    </main>
  )
}
