import { cn } from '@/utils'

type BadgeVariant = 'gold' | 'steel' | 'success' | 'danger' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  gold: 'bg-gold/15 text-gold border border-gold/30',
  steel: 'bg-steel/15 text-steel border border-steel/30',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
  outline: 'bg-transparent text-ash/60 border border-steel/20',
}

export function Badge({ children, variant = 'outline', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-[10px] uppercase tracking-widest px-2 py-0.5',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
