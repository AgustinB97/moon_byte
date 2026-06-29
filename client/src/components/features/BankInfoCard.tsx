import { useState } from 'react'
import { Building2, Copy, Check, AlertCircle } from 'lucide-react'
import { formatCurrency, cn } from '@/utils'
import type { BankInfo } from '@/types'

interface BankInfoCardProps {
  bankInfo: BankInfo
  amount: number
  orderId: string
  variant?: 'full' | 'compact'  // full = con header + instrucciones, compact = solo datos
  className?: string
}

/**
 * Card con los datos bancarios para hacer la transferencia.
 * Reutilizable en CheckoutTransferPage (variant=full) y OrderDetailPage (variant=compact).
 */
export function BankInfoCard({
  bankInfo,
  amount,
  orderId,
  variant = 'full',
  className,
}: BankInfoCardProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const shortOrderCode = `#${orderId.slice(-6).toUpperCase()}`

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  if (variant === 'compact') {
    return (
      <section className={cn('border border-gold/30 bg-surface-mid p-5', className)}>
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={13} className="text-gold" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
            [ Datos para transferir ]
          </p>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-wide text-steel/70 mb-4">
          Banco {bankInfo.bankName} · Monto a transferir{' '}
          <span className="text-gold font-bold">{formatCurrency(amount)}</span>
        </p>

        <div className="grid gap-px bg-steel/10">
          <BankRow label="Titular" value={bankInfo.holder} copyKey="holder" onCopy={handleCopy} copied={copied} />
          <BankRow label="CBU" value={bankInfo.cbu} copyKey="cbu" onCopy={handleCopy} copied={copied} mono />
          <BankRow label="Alias" value={bankInfo.alias} copyKey="alias" onCopy={handleCopy} copied={copied} mono />
          <BankRow label="Concepto / Ref" value={shortOrderCode} copyKey="ref" onCopy={handleCopy} copied={copied} mono />
        </div>
      </section>
    )
  }

  // Variant full — el que se usa en CheckoutTransferPage
  return (
    <div className={cn('bg-surface-mid border border-gold/30 overflow-hidden', className)}>
      <div className="p-6 border-b border-steel/15 bg-surface-dark/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-1">
              [ Pedido confirmado ]
            </p>
            <h2 className="font-display text-3xl uppercase tracking-tightest text-ash leading-tight">
              Datos para
              <br />
              <span className="text-gold">la transferencia</span>
            </h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-widest text-steel/50">Pedido</p>
            <p className="font-mono text-sm text-gold">{shortOrderCode}</p>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-steel/15 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
          Monto a transferir
        </p>
        <p className="font-display text-5xl text-gold tracking-tightest">{formatCurrency(amount)}</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel/50 mt-2">
          ARS · Argentina
        </p>
      </div>

      <div className="p-6 border-b border-steel/15">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-3 flex items-center gap-2">
          <Building2 size={12} />
          {bankInfo.bankName}
        </p>

        <div className="grid gap-px bg-steel/10">
          <BankRow label="Titular" value={bankInfo.holder} copyKey="holder" onCopy={handleCopy} copied={copied} />
          <BankRow label="CBU" value={bankInfo.cbu} copyKey="cbu" onCopy={handleCopy} copied={copied} mono />
          <BankRow label="Alias" value={bankInfo.alias} copyKey="alias" onCopy={handleCopy} copied={copied} mono />
          <BankRow label="Concepto / Referencia" value={shortOrderCode} copyKey="ref" onCopy={handleCopy} copied={copied} mono />
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-gold flex-shrink-0 mt-0.5" />
          <div className="font-mono text-[11px] uppercase tracking-wide text-steel leading-relaxed">
            <p className="text-ash mb-1.5">Importante:</p>
            <ul className="space-y-1.5 text-steel/80">
              <li>1. Realizá la transferencia desde tu home banking</li>
              <li>2. Usá el código <span className="text-gold">{shortOrderCode}</span> como concepto / referencia</li>
              <li>3. Volvé acá y completá el form de abajo con los datos del comprobante</li>
              <li>4. Cuando confirmemos la transferencia, despachamos tu pedido</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function BankRow({
  label,
  value,
  copyKey,
  onCopy,
  copied,
  mono,
}: {
  label: string
  value: string
  copyKey: string
  onCopy: (text: string, key: string) => void
  copied: string | null
  mono?: boolean
}) {
  const isCopied = copied === copyKey
  return (
    <div className="bg-surface-mid p-3 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[9px] uppercase tracking-widest text-steel/60 mb-0.5">
          {label}
        </p>
        <p className={cn(mono ? 'font-mono' : 'font-sans', 'text-ash text-sm truncate')}>
          {value}
        </p>
      </div>
      <button
        onClick={() => onCopy(value, copyKey)}
        className={cn(
          'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 border transition-all flex-shrink-0',
          isCopied
            ? 'border-emerald-400 text-emerald-400 bg-emerald-400/10'
            : 'border-steel/30 text-steel hover:border-gold hover:text-gold'
        )}
      >
        {isCopied ? <Check size={11} /> : <Copy size={11} />}
        {isCopied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}
