import { forwardRef } from 'react'
import { cn } from '@/utils'

type Variant = 'primary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gold text-surface-dark font-semibold border border-gold hover:bg-gold-light active:scale-[0.98] shadow-[0_0_24px_rgba(170,145,63,0.2)]',
  ghost:
    'bg-transparent text-ash hover:bg-surface-mid border border-transparent hover:border-steel/30',
  outline:
    'bg-transparent text-ash border border-steel/40 hover:border-gold hover:text-gold',
  danger:
    'bg-transparent text-red-400 border border-red-500/40 hover:bg-red-500/10',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-mono uppercase tracking-technical',
          'transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
        ) : (
          icon
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
