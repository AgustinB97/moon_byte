import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useThemeStore()
  const isLight = theme === 'light'

  return (
    <button
      onClick={toggle}
      aria-label={isLight ? 'Activar modo oscuro' : 'Activar modo claro'}
      className={cn(
        'relative w-14 h-7 flex items-center transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        'border border-steel/30 hover:border-gold/50',
        isLight ? 'bg-ash-dim/40' : 'bg-surface-mid',
        className
      )}
    >
      {/* Track icons */}
      <Moon
        size={10}
        className={cn(
          'absolute left-2 transition-all duration-300',
          isLight ? 'text-steel/40' : 'text-gold'
        )}
        fill={isLight ? 'none' : 'currentColor'}
      />
      <Sun
        size={10}
        className={cn(
          'absolute right-2 transition-all duration-300',
          isLight ? 'text-gold' : 'text-steel/40'
        )}
      />

      {/* Thumb */}
      <span
        className={cn(
          'absolute w-5 h-5 bg-gold flex items-center justify-center',
          'transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          isLight ? 'translate-x-[30px]' : 'translate-x-[2px]'
        )}
      >
        {isLight
          ? <Sun size={10} className="text-surface-dark" />
          : <Moon size={10} className="text-surface-dark" fill="currentColor" />
        }
      </span>
    </button>
  )
}
