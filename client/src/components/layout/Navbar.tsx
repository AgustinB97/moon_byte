import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Menu, X, User, Moon, Package, LayoutDashboard, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from '@/components/ui'
import { cn } from '@/utils'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const { itemCount, toggleCart } = useCartStore()
  const { user, logout } = useAuthStore()
  const count = itemCount()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/productos?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  const navLinks = [
    { label: 'PCs Armadas', href: '/productos?category=pcs-armadas' },
    { label: 'Componentes', href: '/productos' },
    { label: 'Monitores', href: '/productos?category=monitores' },
    { label: 'Ofertas', href: '/productos?sort=price-asc' },
  ]

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
          scrolled
            ? 'bg-surface-dark/95 backdrop-blur-md border-b border-steel/20 py-3'
            : 'bg-transparent py-5'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="relative w-8 h-8 bg-gold flex items-center justify-center">
              <Moon size={15} className="text-surface-dark" fill="currentColor" />
              <div className="absolute inset-0 ring-1 ring-gold/50 scale-110 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-base text-ash tracking-tightest uppercase">
                MoonByte
              </span>
              <span className="font-mono text-[9px] text-gold uppercase tracking-widest">
                PC Hardware
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="font-mono text-[11px] uppercase tracking-widest text-steel hover:text-ash px-3 py-2 transition-colors duration-200 hover:bg-surface-mid"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-xs">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="BUSCAR HARDWARE..."
                className="w-full bg-surface-dark border border-steel/30 text-ash placeholder:text-steel/40 font-mono text-[11px] uppercase tracking-wide pl-9 pr-4 py-2.5 focus:outline-none focus:border-gold/60 transition-colors duration-200"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {user ? (
              <div className="hidden md:block relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold px-2 py-1.5 transition-colors"
                >
                  <User size={13} />
                  {user.name.split(' ')[0]}
                  <ChevronDown size={10} className={cn('transition-transform', userMenuOpen && 'rotate-180')} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-surface-dark border border-steel/30 min-w-[180px] py-1 z-50">
                    <Link
                      to="/pedidos"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ash/70 hover:text-gold hover:bg-surface-mid transition-colors"
                    >
                      <Package size={12} />
                      Mis Pedidos
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-gold hover:bg-surface-mid transition-colors"
                      >
                        <LayoutDashboard size={12} />
                        Admin Panel
                      </Link>
                    )}
                    <div className="h-px bg-steel/15 my-1" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-steel/60 hover:text-red-400 hover:bg-surface-mid transition-colors text-left"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="hidden md:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold px-2 py-1.5 transition-colors duration-200"
              >
                <User size={13} />
                Ingresar
              </Link>
            )}

            <ThemeToggle className="hidden md:flex" />

            <button
              onClick={toggleCart}
              className="relative p-2 text-steel hover:text-gold transition-colors duration-200 group"
              aria-label="Abrir carrito"
            >
              <ShoppingCart size={18} className="transition-transform duration-200 group-hover:scale-110" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-surface-dark font-mono text-[9px] font-bold flex items-center justify-center">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-steel hover:text-ash transition-colors duration-200"
              aria-label="Menu"
            >
              <span className={cn('block transition-all duration-300', isMenuOpen ? 'rotate-90' : '')}>
                {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </span>
            </button>
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-surface-dark/98 backdrop-blur-xl flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="flex-1 flex flex-col justify-center px-8 gap-2 mt-20">
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel/50 mb-4">
            [ Navegación ]
          </p>
          {navLinks.map((link, i) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                'font-display text-4xl uppercase tracking-tightest text-ash hover:text-gold py-2',
                'border-b border-steel/10 transition-all duration-300',
                isMenuOpen ? 'animate-reveal' : 'opacity-0'
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {link.label}
            </Link>
          ))}

          <form onSubmit={handleSearch} className="mt-8">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="BUSCAR..."
                className="w-full bg-surface border border-steel/30 text-ash placeholder:text-steel/40 font-mono text-sm uppercase tracking-widest pl-9 pr-4 py-3 focus:outline-none focus:border-gold/60"
              />
            </div>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-steel/50">Tema</span>
            <ThemeToggle />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  to="/pedidos"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ash hover:text-gold transition-colors"
                >
                  <Package size={13} />
                  Mis Pedidos
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-gold hover:text-gold-light transition-colors"
                  >
                    <LayoutDashboard size={13} />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setIsMenuOpen(false) }}
                  className="font-mono text-[11px] uppercase tracking-widest text-steel/70 hover:text-red-400 transition-colors text-left"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsMenuOpen(false)}
                className="font-mono text-[11px] uppercase tracking-widest text-steel hover:text-gold transition-colors"
              >
                [ Ingresar / Registrarse ]
              </Link>
            )}
          </div>
        </div>

        <div className="p-8 border-t border-steel/10">
          <p className="font-mono text-[10px] text-steel/30 uppercase tracking-widest">
            MoonByte — REV 1.0 — Sistema Activo
          </p>
        </div>
      </div>
    </>
  )
}
