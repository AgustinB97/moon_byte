import { Link } from 'react-router-dom'
import { Moon } from 'lucide-react'

const footerLinks = {
  Productos: [
    { label: 'PCs Armadas', href: '/productos?category=pcs-armadas' },
    { label: 'Procesadores', href: '/productos?category=procesadores' },
    { label: 'Placas de Video', href: '/productos?category=placas-de-video' },
    { label: 'Monitores', href: '/productos?category=monitores' },
  ],
  Empresa: [
    { label: 'Nosotros', href: '#' },
    { label: 'Contacto', href: '#' },
    { label: 'Blog Tech', href: '#' },
    { label: 'Garantías', href: '#' },
  ],
  Legal: [
    { label: 'Términos de Uso', href: '#' },
    { label: 'Privacidad', href: '#' },
    { label: 'Devoluciones', href: '#' },
  ],
}

const socials = [
  {
    label: 'Instagram',
    handle: '@moonbyte.ar',
    href: 'https://instagram.com',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    handle: 'MoonByte',
    href: 'https://youtube.com',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'X / Twitter',
    handle: '@moonbyte_ar',
    href: 'https://x.com',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    handle: '@moonbyte',
    href: 'https://tiktok.com',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z" />
      </svg>
    ),
  },
  {
    label: 'Discord',
    handle: 'MoonByte Hub',
    href: 'https://discord.gg',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
]

export function Footer() {
  return (
    <footer className="border-t border-steel/20 bg-surface-dark mt-24">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-gold flex items-center justify-center">
                <Moon size={14} className="text-surface-dark" fill="currentColor" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-sm text-ash tracking-tightest uppercase">MoonByte</span>
                <span className="font-mono text-[9px] text-gold uppercase tracking-widest">PC Hardware</span>
              </div>
            </Link>
            <p className="font-mono text-[11px] text-steel/70 leading-relaxed uppercase tracking-wide max-w-[200px]">
              PCs armadas y componentes para gamers y profesionales.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 border border-gold/20 px-3 py-1.5">
              <span className="w-1.5 h-1.5 bg-gold animate-pulse" />
              <span className="font-mono text-[9px] text-gold/70 uppercase tracking-widest">
                Online 24/7
              </span>
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-steel mb-4">
                [ {section} ]
              </h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="font-mono text-[11px] text-ash/50 hover:text-gold uppercase tracking-wide transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── REDES SOCIALES ── */}
        <div className="border-t border-steel/15 pt-10 mb-10">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-steel mb-6">
            [ Redes Sociales ]
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 border border-steel/15 px-4 py-3 hover:border-gold/50 hover:bg-gold/5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <span className="text-steel/50 group-hover:text-gold transition-colors duration-200 flex-shrink-0">
                  {s.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ash/70 group-hover:text-ash transition-colors duration-200 truncate">
                    {s.label}
                  </span>
                  <span className="font-mono text-[9px] text-steel/40 group-hover:text-gold/60 transition-colors duration-200 truncate">
                    {s.handle}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-steel/15 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="font-mono text-[10px] text-steel/30 uppercase tracking-widest">
            © 2026 MoonByte — Todos los derechos reservados
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] text-steel/20 uppercase tracking-widest">REV 1.0.0</span>
            <span className="font-mono text-[9px] text-steel/20">///</span>
            <span className="font-mono text-[9px] text-steel/20 uppercase tracking-widest">ARG-SERVER-01</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
