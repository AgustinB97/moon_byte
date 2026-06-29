import { forwardRef } from 'react'
import { cn } from '@/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="font-mono text-[10px] uppercase tracking-widest text-steel">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-steel">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-surface-dark border border-steel/30 text-ash placeholder:text-steel/50',
              'font-mono text-sm px-4 py-3',
              'focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30',
              'transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
              icon && 'pl-10',
              error && 'border-red-500/50 focus:border-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest">
            [ {error} ]
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
