import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Botón para volver al home desde las páginas de auth.
 * Se renderiza fijo en la esquina superior izquierda.
 */
export function AuthBackLink() {
  return (
    <Link
      to="/"
      className="fixed top-6 left-6 z-10 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group"
    >
      <span className="w-7 h-7 border border-steel/30 group-hover:border-gold flex items-center justify-center transition-colors duration-300">
        <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
      </span>
      <span className="hidden sm:inline">Volver al inicio</span>
    </Link>
  )
}
