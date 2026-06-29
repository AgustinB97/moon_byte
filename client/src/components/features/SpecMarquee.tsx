import { cn } from '@/utils'

interface SpecMarqueeProps {
  items?: string[]
  speed?: 'slow' | 'medium' | 'fast'
  className?: string
  reverse?: boolean
}

const DEFAULT_SPECS = [
  'RTX 4090 24GB',
  '64GB DDR5 6000MHz',
  '4TB NVMe PCIe 5.0',
  'Ryzen 9 7950X3D',
  '360mm AIO Liquid',
  '1200W 80+ Platinum',
  'X870E Chipset',
  'WiFi 7 / BT 5.4',
  'USB 4.0 / Thunderbolt',
  'OLED 4K 240Hz',
  'CL30 Latency',
  '7450 MB/s Read',
]

const speedClass: Record<NonNullable<SpecMarqueeProps['speed']>, string> = {
  slow: 'animate-[marquee_60s_linear_infinite]',
  medium: 'animate-[marquee_35s_linear_infinite]',
  fast: 'animate-[marquee_20s_linear_infinite]',
}

export function SpecMarquee({
  items = DEFAULT_SPECS,
  speed = 'medium',
  className,
  reverse = false,
}: SpecMarqueeProps) {
  // Duplicate for seamless loop
  const list = [...items, ...items]

  return (
    <div
      className={cn(
        'relative overflow-hidden border-y border-steel/15 bg-surface-dark/60',
        className
      )}
      aria-hidden="true"
    >
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-surface to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-surface to-transparent pointer-events-none" />

      <div
        className={cn(
          'flex gap-12 py-3 whitespace-nowrap w-max',
          speedClass[speed],
          reverse && 'flex-row-reverse'
        )}
      >
        {list.map((spec, i) => (
          <div key={`${spec}-${i}`} className="flex items-center gap-3 flex-shrink-0">
            {/* Cross marker */}
            <span className="font-mono text-gold/40 text-xs leading-none select-none">+</span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-ash/70">
              {spec}
            </span>
            <span className="font-mono text-steel/30 text-xs select-none">///</span>
          </div>
        ))}
      </div>
    </div>
  )
}
