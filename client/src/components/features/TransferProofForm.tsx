import { useRef, useState, useEffect } from 'react'
import {
  Building2,
  CheckCircle2,
  Loader2,
  Receipt,
  Upload,
  Calendar,
  Hash,
  FileText,
  Camera,
  FileIcon,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { submitTransferProof, type TransferProofPayload } from '@/services/orders'
import { uploadProof, validateProofFile } from '@/services/upload'
import { formatCurrency, cn } from '@/utils'
import type { Order, TransferProof } from '@/types'

interface TransferProofFormProps {
  orderId: string
  expectedAmount: number
  existingProof?: TransferProof
  onSubmitted?: (order: Order) => void
  className?: string
}

type SubmitMode = 'data' | 'file'

export function TransferProofForm({
  orderId,
  expectedAmount,
  existingProof,
  onSubmitted,
  className,
}: TransferProofFormProps) {
  if (existingProof?.submittedAt) {
    return <TransferProofSummary proof={existingProof} className={className} />
  }

  return (
    <ProofFormFields
      orderId={orderId}
      expectedAmount={expectedAmount}
      onSubmitted={onSubmitted}
      className={className}
    />
  )
}

function ProofFormFields({
  orderId,
  expectedAmount,
  onSubmitted,
  className,
}: Omit<TransferProofFormProps, 'existingProof'>) {
  const today = new Date().toISOString().slice(0, 10)
  const [mode, setMode] = useState<SubmitMode>('data')

  // Campos manuales
  const [transferDate, setTransferDate] = useState(today)
  const [amount, setAmount] = useState(String(expectedAmount))
  const [fromBank, setFromBank] = useState('')
  const [reference, setReference] = useState('')

  // Compartido entre los 2 modos
  const [notes, setNotes] = useState('')
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Liberar object URL al desmontar o cambiar archivo
  useEffect(() => {
    return () => { if (localPreview) URL.revokeObjectURL(localPreview) }
  }, [localPreview])

  const handleFile = async (file: File) => {
    setUploadError('')
    const validationError = validateProofFile(file)
    if (validationError) { setUploadError(validationError); return }

    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      setLocalPreview(URL.createObjectURL(file))
    } else {
      setLocalPreview(null)
    }

    setUploadProgress(0)
    try {
      const result = await uploadProof(file, (p) => setUploadProgress(p))
      setReceiptUrl(result.url)
      setUploadProgress(null)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setUploadError(msg ?? 'Error al subir el comprobante')
      setUploadProgress(null)
      setSelectedFile(null)
      setLocalPreview(null)
    }
  }

  const handleClearFile = () => {
    setReceiptUrl(null)
    setSelectedFile(null)
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(null)
  }

  const handleSubmit = async () => {
    setError('')

    if (mode === 'data') {
      // Validar campos manuales
      if (!transferDate) { setError('La fecha es requerida'); return }
      const amountNum = Number(amount)
      if (!Number.isFinite(amountNum) || amountNum <= 0) { setError('Monto inválido'); return }
      if (!fromBank.trim()) { setError('El banco emisor es requerido'); return }
      if (!reference.trim()) { setError('El número de operación es requerido'); return }
    } else {
      if (!receiptUrl) { setError('Tenés que subir el comprobante'); return }
    }

    const payload: TransferProofPayload =
      mode === 'data'
        ? {
            transferDate,
            amount: Number(amount),
            fromBank: fromBank.trim(),
            reference: reference.trim(),
            notes: notes.trim() || undefined,
            receiptImageUrl: receiptUrl ?? undefined,
          }
        : {
            // Solo imagen + notas optional. Los demás campos van vacíos.
            transferDate: today,
            amount: 0,
            fromBank: '',
            reference: '',
            notes: notes.trim() || undefined,
            receiptImageUrl: receiptUrl!,
          }

    setIsSubmitting(true)
    try {
      const order = await submitTransferProof(orderId, payload)
      onSubmitted?.(order)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al enviar el comprobante')
    } finally {
      setIsSubmitting(false)
    }
  }

  const amountNum = Number(amount)
  const amountMatch = Number.isFinite(amountNum) && amountNum === expectedAmount

  return (
    <section className={cn('border border-steel/20 bg-surface-mid p-5', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Receipt size={13} className="text-gold" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
          [ Envianos el comprobante ]
        </p>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-wide text-steel/70 leading-relaxed mb-4">
        Una vez que hiciste la transferencia, elegí cómo querés enviarnos los datos.
      </p>

      {/* ── Switch de modo ── */}
      <div className="grid grid-cols-2 gap-px bg-steel/15 border border-steel/15 mb-5">
        <ModeButton
          active={mode === 'data'}
          onClick={() => setMode('data')}
          icon={<FileText size={13} />}
          label="Cargar los datos"
          subtitle="Completás un formulario corto"
        />
        <ModeButton
          active={mode === 'file'}
          onClick={() => setMode('file')}
          icon={<Camera size={13} />}
          label="Subir comprobante"
          subtitle="Foto o captura del comprobante"
        />
      </div>

      {/* ── Modo: datos manuales ── */}
      {mode === 'data' && (
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <Input
            label="Fecha de transferencia"
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
            max={today}
            icon={<Calendar size={13} />}
          />

          <div>
            <Input
              label="Monto transferido"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(expectedAmount)}
              icon={<span className="font-mono text-xs text-steel">$</span>}
            />
            {amount && !amountMatch && (
              <p className="font-mono text-[9px] uppercase tracking-widest text-gold/70 mt-1">
                ⚠ No coincide con el total esperado ({formatCurrency(expectedAmount)})
              </p>
            )}
          </div>

          <Input
            label="Banco emisor"
            value={fromBank}
            onChange={(e) => setFromBank(e.target.value)}
            placeholder="Galicia, Santander, BBVA, etc."
            icon={<Building2 size={13} />}
          />

          <Input
            label="Nº de operación"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="123456789"
            icon={<Hash size={13} />}
          />
        </div>
      )}

      {/* ── Modo: subir archivo ── */}
      {mode === 'file' && (
        <div className="animate-fade-in">
          {uploadProgress !== null ? (
            /* Subiendo */
            <div className="border border-gold/40 bg-surface-dark/40 p-6 text-center">
              <Loader2 size={20} className="text-gold animate-spin mx-auto mb-3" />
              <div className="h-1.5 bg-steel/20 max-w-xs mx-auto">
                <div className="h-full bg-gold transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="font-mono text-[10px] text-gold mt-3 uppercase tracking-widest">
                Subiendo · {uploadProgress}%
              </p>
            </div>
          ) : receiptUrl && selectedFile ? (
            /* Subido — preview según tipo */
            <div className="border border-emerald-400/40 bg-emerald-400/5">
              {localPreview ? (
                /* Imagen: preview visual */
                <img
                  src={localPreview}
                  alt="Preview del comprobante"
                  className="w-full max-h-48 object-contain bg-surface-dark"
                />
              ) : (
                /* PDF: ícono + nombre */
                <div className="flex items-center gap-3 px-4 py-5">
                  <FileIcon size={28} className="text-emerald-400 flex-shrink-0" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-400 truncate flex-1">
                    {selectedFile.name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 px-3 py-2 border-t border-emerald-400/20">
                <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 flex-1">
                  Listo para enviar
                </span>
                <button
                  onClick={handleClearFile}
                  className="font-mono text-[10px] uppercase tracking-widest text-steel hover:text-red-400 transition-colors"
                >
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            /* Sin archivo — drop zone */
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-steel/30 bg-surface-dark/20 hover:border-gold/50 hover:bg-surface-dark/40 transition-colors p-8 flex flex-col items-center gap-3"
            >
              <Upload size={28} className="text-steel" />
              <div className="text-center">
                <p className="font-mono text-[11px] uppercase tracking-widest text-ash mb-1">
                  Click para seleccionar el comprobante
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-steel/50">
                  JPG · PNG · WebP · PDF · Máx 10MB
                </p>
              </div>
            </button>
          )}

          {uploadError && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-red-400 mt-2">
              {uploadError}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
              e.target.value = ''
            }}
          />
        </div>
      )}

      {/* Notas — compartido entre los 2 modos */}
      <div className="mt-4">
        <label className="font-mono text-[10px] uppercase tracking-widest text-steel block mb-1.5">
          Notas (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Cualquier dato adicional que quieras agregar"
          className="w-full bg-surface-dark border border-steel/30 text-ash font-mono text-sm px-4 py-3 focus:outline-none focus:border-gold/60 transition-colors resize-y"
        />
      </div>

      {error && (
        <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest border border-red-500/20 px-3 py-2 mt-4">
          [ Error ] {error}
        </p>
      )}

      <Button
        size="lg"
        className="w-full mt-4 group"
        onClick={handleSubmit}
        loading={isSubmitting}
        disabled={uploadProgress !== null}
      >
        Enviar comprobante
      </Button>
    </section>
  )
}

// ───────────────────────────────────────────────────────────
function ModeButton({
  active,
  onClick,
  icon,
  label,
  subtitle,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  subtitle: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left p-3 transition-all duration-200',
        active
          ? 'bg-gold/10 border-l-2 border-gold'
          : 'bg-surface-dark/30 hover:bg-surface-dark/60 border-l-2 border-transparent'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={active ? 'text-gold' : 'text-steel'}>{icon}</span>
        <p className={cn(
          'font-mono text-[10px] uppercase tracking-widest font-semibold',
          active ? 'text-gold' : 'text-ash/70'
        )}>
          {label}
        </p>
      </div>
      <p className="font-mono text-[9px] uppercase tracking-widest text-steel/50 leading-relaxed">
        {subtitle}
      </p>
    </button>
  )
}

// ───────────────────────────────────────────────────────────
function TransferProofSummary({
  proof,
  className,
}: {
  proof: TransferProof
  className?: string
}) {
  const submittedAt = new Date(proof.submittedAt).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const hasManualData = !!proof.fromBank && !!proof.reference

  return (
    <section className={cn('border border-emerald-400/30 bg-emerald-400/5 p-5', className)}>
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={14} className="text-emerald-400" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
          [ Comprobante recibido ]
        </p>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-wide text-steel/70 mb-4">
        Enviado el {submittedAt}. Estamos verificando la transferencia.
      </p>

      {hasManualData && (
        <div className="grid grid-cols-2 gap-px bg-steel/10 mb-3">
          {proof.transferDate && (
            <ProofRow
              label="Fecha"
              value={new Date(proof.transferDate).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            />
          )}
          {proof.amount && proof.amount > 0 && (
            <ProofRow label="Monto" value={formatCurrency(proof.amount)} mono />
          )}
          {proof.fromBank && <ProofRow label="Banco emisor" value={proof.fromBank} />}
          {proof.reference && <ProofRow label="Nº operación" value={proof.reference} mono />}
        </div>
      )}

      {proof.notes && (
        <p className="font-mono text-[10px] uppercase tracking-wide text-steel/70 mb-3">
          <span className="text-steel/40">Notas:</span> {proof.notes}
        </p>
      )}

      {proof.receiptImageUrl && (
        <a
          href={proof.receiptImageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gold hover:text-gold-light transition-colors"
        >
          <Receipt size={12} />
          Ver imagen del comprobante
        </a>
      )}
    </section>
  )
}

function ProofRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-surface-mid p-3">
      <p className="font-mono text-[9px] uppercase tracking-widest text-steel/60 mb-0.5">{label}</p>
      <p className={cn(mono ? 'font-mono' : 'font-sans', 'text-ash text-sm')}>{value}</p>
    </div>
  )
}
