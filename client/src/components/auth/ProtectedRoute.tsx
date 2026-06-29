import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

type Requirement = 'auth' | 'admin'

interface ProtectedRouteProps {
  children: React.ReactNode
  require?: Requirement
}

/**
 * Envuelve rutas que requieren autenticación o rol admin.
 *
 * Flujo:
 *  1. Si hay token pero no user → llama loadUser (hidrata desde /auth/me)
 *  2. Si no hay token → redirige a /auth con returnUrl en query
 *  3. Si require='admin' y user.role !== 'admin' → redirige a /
 */
export function ProtectedRoute({ children, require = 'auth' }: ProtectedRouteProps) {
  const { user, token, loadUser } = useAuthStore()
  const location = useLocation()
  const [checking, setChecking] = useState(!!token && !user)

  useEffect(() => {
    if (token && !user) {
      loadUser().finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [token, user, loadUser])

  if (checking) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 size={32} className="text-gold animate-spin" />
      </main>
    )
  }

  if (!token || !user) {
    // Preservar pathname + search + hash para que el link del mail
    // (ej. /pedidos/abc#comprobante) mantenga el anchor post-login
    const returnUrl = encodeURIComponent(
      location.pathname + location.search + location.hash
    )
    return <Navigate to={`/auth?returnUrl=${returnUrl}`} replace />
  }

  if (require === 'admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
