import { Star } from 'lucide-react'
import { cn } from '@/utils'

interface StarRatingProps {
  rating: number
  max?: number
  size?: number
  className?: string
}

export function StarRating({ rating, max = 5, size = 12, className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i < Math.floor(rating) ? 'fill-gold text-gold' : 'fill-transparent text-steel/40'
          )}
        />
      ))}
    </div>
  )
}
