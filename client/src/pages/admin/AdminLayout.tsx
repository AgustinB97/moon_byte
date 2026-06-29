import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Moon, ArrowLeft, Menu, X, Calculator, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/calculadora', label: 'Calculadora', icon: Calculator },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-[100dvh] bg-surface flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-56 flex-col bg-surface-dark border-r border-steel/15 fixed top-0 left-0 bottom-0 z-30">
        <SidebarContent userName={user?.name ?? 'Admin'} onLogout={logout} />
      </aside>

      {/* Sidebar — mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden transition-opacity duration-300',
          sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/70 transition-opacity duration-300',
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={cn(
            'absolute left-0 top-0 bottom-0 w-64 bg-surface-dark border-r border-steel/15 flex flex-col',
            'transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <SidebarContent
            userName={user?.name ?? 'Admin'}
            onLogout={logout}
            onNavigate={() => setSidebarOpen(false)}
          />
        </aside>
      </div>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-surface-dark/95 backdrop-blur-md border-b border-steel/15 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gold flex items-center justify-center">
            <Moon size={14} className="text-surface-dark" fill="currentColor" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm text-ash tracking-tightest uppercase">MoonByte</span>
            <span className="font-mono text-[9px] text-gold uppercase tracking-widest">Admin</span>
          </div>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-steel hover:text-gold transition-colors"
          aria-label="Menu"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 md:ml-56 pt-16 md:pt-0 min-h-[100dvh]">
        <Outlet />
      </main>
    </div>
  )
}

function SidebarContent({
  userName,
  onLogout,
  onNavigate,
}: {
  userName: string
  onLogout: () => void
  onNavigate?: () => void
}) {
  return (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-steel/15">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gold flex items-center justify-center">
            <Moon size={15} className="text-surface-dark" fill="currentColor" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base text-ash tracking-tightest uppercase">MoonByte</span>
            <span className="font-mono text-[9px] text-gold uppercase tracking-widest">Admin Panel</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        <p className="font-mono text-[9px] uppercase tracking-widest text-steel/40 px-3 py-2">
          [ Gestión ]
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-all duration-200',
                'border-l-2',
                isActive
                  ? 'bg-gold/10 text-gold border-gold'
                  : 'text-ash/60 hover:text-ash hover:bg-surface-mid border-transparent'
              )
            }
          >
            <item.icon size={14} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-steel/15">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-gold/20 border border-gold/40 flex items-center justify-center font-mono text-[10px] text-gold">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-mono text-[10px] text-ash truncate">{userName}</span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-gold">Admin</span>
          </div>
        </div>

        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-colors mb-2"
        >
          <ArrowLeft size={12} />
          Volver a la tienda
        </Link>
        <button
          onClick={onLogout}
          className="font-mono text-[10px] uppercase tracking-widest text-steel/60 hover:text-red-400 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  )
}
