import { useState } from 'react'
import { ShieldCheck, ShieldOff, Copy, Check, AlertTriangle } from 'lucide-react'
import { setup2fa, enable2fa, disable2fa } from '@/services/auth'
import { Button, Input } from '@/components/ui'
import { cn } from '@/utils'

type Step = 'idle' | 'scanning' | 'backup' | 'disabling'

interface TwoFactorSetupProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

export function TwoFactorSetup({ isEnabled, onToggle }: TwoFactorSetupProps) {
  const [step, setStep] = useState<Step>('idle')
  const [qrUrl, setQrUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // ── Activar: paso 1 — obtener QR ───────────────────────
  const handleStartSetup = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await setup2fa()
      setQrUrl(data.qrCodeUrl)
      setSecret(data.secret)
      setStep('scanning')
    } catch {
      setError('No se pudo obtener el QR. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Activar: paso 2 — verificar primer código ──────────
  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) { setError('Ingresá los 6 dígitos'); return }
    setLoading(true)
    setError('')
    try {
      const result = await enable2fa(code)
      setBackupCodes(result.backupCodes)
      setStep('backup')
      onToggle(true)
    } catch {
      setError('Código incorrecto. Verificá que la hora del dispositivo esté sincronizada.')
    } finally {
      setLoading(false)
      setCode('')
    }
  }

  // ── Desactivar ─────────────────────────────────────────
  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) { setError('Ingresá los 6 dígitos'); return }
    setLoading(true)
    setError('')
    try {
      await disable2fa(code)
      setStep('idle')
      onToggle(false)
    } catch {
      setError('Código incorrecto.')
    } finally {
      setLoading(false)
      setCode('')
    }
  }

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Vista: códigos de respaldo (mostrar una sola vez) ──
  if (step === 'backup') {
    return (
      <div className="border border-emerald-400/30 bg-emerald-400/5 p-5">
        <div className="flex items-start gap-3 mb-4">
          <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-1">
              2FA activado correctamente
            </p>
            <p className="font-mono text-[11px] text-ash/70">
              Guardá estos códigos de respaldo en un lugar seguro. Solo se muestran esta vez.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-surface-dark border border-steel/20 p-4 mb-4 font-mono text-sm text-ash">
          {backupCodes.map((c) => (
            <span key={c} className="text-center tracking-widest">{c}</span>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyBackupCodes}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest border border-steel/30 hover:border-gold hover:text-gold text-steel px-3 py-2 transition-colors"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'Copiados' : 'Copiar códigos'}
          </button>
          <Button size="sm" onClick={() => setStep('idle')}>
            Listo
          </Button>
        </div>
      </div>
    )
  }

  // ── Vista: desactivar ──────────────────────────────────
  if (step === 'disabling') {
    return (
      <form onSubmit={handleDisable} className="border border-red-500/20 bg-red-500/5 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-red-400 mb-4">
          Ingresá tu código TOTP para desactivar
        </p>
        <div className="flex gap-3 items-end">
          <div className="w-48">
            <Input
              label="Código de 6 dígitos"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              autoFocus
            />
          </div>
          <Button type="submit" variant="outline" size="md" loading={loading}>
            Confirmar
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={() => { setStep('idle'); setCode(''); setError('') }}>
            Cancelar
          </Button>
        </div>
        {error && (
          <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest mt-3">{error}</p>
        )}
      </form>
    )
  }

  // ── Vista: escanear QR ─────────────────────────────────
  if (step === 'scanning') {
    return (
      <div className="border border-steel/20 bg-surface-mid p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-4">
          [ Paso 1 — Escaneá el QR ]
        </p>

        <div className="flex flex-col md:flex-row gap-5 mb-5">
          {qrUrl && (
            <img src={qrUrl} alt="QR 2FA" className="w-40 h-40 flex-shrink-0 bg-white p-2" />
          )}
          <div className="flex flex-col gap-2 justify-center">
            <p className="font-mono text-[11px] text-ash/70">
              Abrí Google Authenticator o Authy y escaneá el QR. Si no podés escanearlo, usá el código manual:
            </p>
            <div className="flex items-center gap-2">
              <code className="font-mono text-[11px] text-gold bg-surface-dark px-3 py-2 border border-steel/20 flex-1 break-all">
                {secret}
              </code>
              <button onClick={copySecret} className="p-2 text-steel hover:text-gold transition-colors flex-shrink-0">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleEnable} className="flex flex-col gap-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel">
            [ Paso 2 — Ingresá el primer código ]
          </p>
          <div className="flex gap-3 items-end">
            <div className="w-48">
              <Input
                label="Código de 6 dígitos"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
              />
            </div>
            <Button type="submit" size="md" loading={loading}>
              Activar 2FA
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={() => { setStep('idle'); setCode(''); setError('') }}>
              Cancelar
            </Button>
          </div>
          {error && (
            <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest">{error}</p>
          )}
        </form>
      </div>
    )
  }

  // ── Vista: idle ────────────────────────────────────────
  return (
    <div className={cn(
      'border p-4 flex items-center justify-between gap-4',
      isEnabled ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-steel/20 bg-surface-mid'
    )}>
      <div className="flex items-center gap-3">
        {isEnabled
          ? <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
          : <ShieldOff size={18} className="text-steel/50 flex-shrink-0" />
        }
        <div>
          <p className={cn('font-mono text-[11px] uppercase tracking-widest', isEnabled ? 'text-emerald-400' : 'text-ash')}>
            {isEnabled ? '2FA activado' : '2FA desactivado'}
          </p>
          <p className="font-mono text-[10px] text-steel/50 mt-0.5">
            {isEnabled
              ? 'Tu cuenta está protegida con autenticación de dos factores'
              : 'Recomendado para cuentas de administrador'}
          </p>
        </div>
      </div>

      {isEnabled ? (
        <button
          onClick={() => { setStep('disabling'); setError('') }}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest border border-red-500/30 hover:border-red-400 text-red-400 hover:text-red-300 px-3 py-2 transition-colors flex-shrink-0"
        >
          <AlertTriangle size={10} />
          Desactivar
        </button>
      ) : (
        <Button size="sm" onClick={handleStartSetup} loading={loading}>
          Activar 2FA
        </Button>
      )}
    </div>
  )
}
