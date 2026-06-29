import { useState } from 'react'
import { Shield } from 'lucide-react'
import { TwoFactorSetup } from '@/components/admin/TwoFactorSetup'
import { useAuthStore } from '@/store/authStore'

export function AdminSettings() {
  const user = useAuthStore((s) => s.user)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    // El backend incluye twoFactorEnabled en el objeto user si es admin
    (user as (typeof user & { twoFactorEnabled?: boolean }) | null)?.twoFactorEnabled ?? false
  )

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
          [ Admin / Configuración ]
        </p>
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] uppercase tracking-tightest text-ash">
          Configuración
        </h1>
      </div>

      {/* Seguridad */}
      <section className="border border-steel/15 bg-surface-mid p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} className="text-steel" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel">
            [ Seguridad ]
          </p>
        </div>

        <TwoFactorSetup
          isEnabled={twoFactorEnabled}
          onToggle={setTwoFactorEnabled}
        />
      </section>
    </div>
  )
}
