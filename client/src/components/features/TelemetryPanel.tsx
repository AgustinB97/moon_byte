import { useEffect, useState } from 'react'
import { cn } from '@/utils'

interface Reading {
  label: string
  value: string
  unit?: string
  trend?: 'up' | 'down' | 'stable'
}

function pulseValue(base: number, variance: number): number {
  return Math.round(base + (Math.random() - 0.5) * variance)
}

export function TelemetryPanel({ className }: { className?: string }) {
  const [tick, setTick] = useState(0)
  const [readings, setReadings] = useState<Reading[]>([])

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setReadings([
      { label: 'Builds Activas', value: String(pulseValue(127, 8)), trend: 'up' },
      { label: 'Online Now', value: String(pulseValue(348, 24)), unit: 'usr', trend: 'up' },
      { label: 'Despachos Hoy', value: String(pulseValue(42, 6)), trend: 'stable' },
      { label: 'Stock Crítico', value: String(pulseValue(3, 2)), unit: 'items', trend: 'down' },
    ])
  }, [tick])

  const time = new Date().toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div
      className={cn(
        'relative bg-surface-dark/80 backdrop-blur-md border border-steel/20 overflow-hidden',
        'animate-reveal-delay-3',
        className
      )}
    >
      {/* Scanning line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 right-0 h-12 bg-gradient-to-b from-transparent via-gold/[0.03] to-transparent animate-[scan_4s_linear_infinite]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-steel/15 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-gold animate-pulse" />
          <span className="font-mono text-[8px] uppercase tracking-widest text-gold/80">
            TELEMETRÍA LIVE
          </span>
        </div>
        <span className="font-mono text-[8px] text-steel/40 tabular-nums">
          {time}
        </span>
      </div>

      {/* Readings */}
      <div className="grid grid-cols-2 divide-x divide-y divide-steel/10">
        {readings.map((r) => (
          <div key={r.label} className="p-3 relative">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-mono text-[8px] uppercase tracking-widest text-steel/50">
                {r.label}
              </span>
              {r.trend === 'up' && <span className="font-mono text-[9px] text-gold">▲</span>}
              {r.trend === 'down' && <span className="font-mono text-[9px] text-steel/40">▼</span>}
              {r.trend === 'stable' && <span className="font-mono text-[9px] text-steel/40">━</span>}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl text-ash tabular-nums leading-none animate-[flicker_3s_ease-in-out_infinite]">
                {r.value}
              </span>
              {r.unit && (
                <span className="font-mono text-[9px] uppercase tracking-widest text-steel/60">
                  {r.unit}
                </span>
              )}
            </div>
            {/* Mini bar */}
            <div className="mt-2 h-0.5 w-full bg-steel/10">
              <div
                className="h-full bg-gold/60 transition-all duration-700 ease-out"
                style={{ width: `${30 + ((Number(r.value) * 7) % 60)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-steel/15 px-3 py-2 flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-widest text-steel/40">
          SYS://moonbyte/core
        </span>
        <span className="font-mono text-[8px] text-gold/50">
          T+{String(tick).padStart(4, '0')}
        </span>
      </div>
    </div>
  )
}
