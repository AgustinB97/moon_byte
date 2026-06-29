import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MapPin,
  CreditCard,
  Building2,
  FileText,
  Plus,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Truck,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useCartStore } from '@/store/cartStore'
import { startCheckout } from '@/services/orders'
import { formatCurrency, cn } from '@/utils'
import { useCotizarEnvio } from '@/modules/shipping'
import type {
  PaymentMethod,
  TaxCategory,
  ShippingExtra,
  BillingInfo,
  Address,
} from '@/types'

type ShippingForm = Address

const EMPTY_ADDRESS: Address = {
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Argentina',
}

const EMPTY_EXTRA: ShippingExtra = {
  apartment: '',
  phone: '',
  deliveryNotes: '',
}

const EMPTY_BILLING: BillingInfo = {
  invoiceType: 'C', // MoonByte es monotributista → siempre Factura C
  name: '',
  taxId: '',
  taxCategory: 'consumidor_final',
  billingAddress: { ...EMPTY_ADDRESS },
}

const TAX_CATEGORY_LABELS: Record<TaxCategory, string> = {
  consumidor_final: 'Consumidor Final',
  monotributo: 'Monotributo',
  responsable_inscripto: 'Responsable Inscripto',
  exento: 'Exento',
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, total } = useCartStore()

  const [shipping, setShipping] = useState<ShippingForm>({ ...EMPTY_ADDRESS })
  const [extra, setExtra] = useState<ShippingExtra>({ ...EMPTY_EXTRA })
  const [billing, setBilling] = useState<BillingInfo>({ ...EMPTY_BILLING })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  // ── Cotización automática de envío ──
  const { cotizar, opcion: shippingOpcion, loading: isQuotingShipping } = useCotizarEnvio()
  const cotizarRef = useRef(cotizar)
  cotizarRef.current = cotizar

  const cpOrigen = import.meta.env.VITE_CP_ORIGEN ?? '1642'

  // El servidor puede devolver pesoEmbalado/alto/ancho/largo o weightGrams/dimensions.*
  const getPeso  = (p: typeof items[0]['product']) => p.weightGrams  ?? p.pesoEmbalado
  const getAlto  = (p: typeof items[0]['product']) => p.dimensions?.heightCm ?? p.alto
  const getAncho = (p: typeof items[0]['product']) => p.dimensions?.widthCm  ?? p.ancho
  const getLargo = (p: typeof items[0]['product']) => p.dimensions?.depthCm  ?? p.largo

  const pesoKg = useMemo(
    () => items.reduce((acc, i) => acc + (getPeso(i.product) ?? 500) / 1000 * i.quantity, 0),
    [items]
  )
  const dimensiones = useMemo(() => ({
    largo: items.length ? Math.max(...items.map((i) => getLargo(i.product) ?? 30)) : 30,
    ancho: items.length ? Math.max(...items.map((i) => getAncho(i.product) ?? 25)) : 25,
    alto:  items.length ? Math.max(...items.map((i) => getAlto(i.product)  ?? 20)) : 20,
  }), [items])

  // ── Recalcular total según método de pago ──
  const cartTotal = total()
  const transferDiscountPct = 0.064
  const estimatedTransferTotal = useMemo(
    () => Math.round(cartTotal * (1 - transferDiscountPct)),
    [cartTotal]
  )
  const displayedSubtotal = paymentMethod === 'transferencia' ? estimatedTransferTotal : cartTotal

  // CP válido = exactamente 4 dígitos numéricos
  const cpDestino = shipping.postalCode.replace(/\D/g, '').slice(0, 4)
  const cpValido = cpDestino.length === 4

  // Ref para capturar el subtotal actual sin re-disparar la cotización
  const displayedSubtotalRef = useRef(displayedSubtotal)
  displayedSubtotalRef.current = displayedSubtotal

  // Auto-cotizar solo cuando cambia CP o peso — el método de pago no afecta el costo de Andreani
  useEffect(() => {
    if (!cpValido) return
    const timer = setTimeout(() => {
      void cotizarRef.current({
        cpOrigen,
        cpDestino,
        pesoKg,
        largo: dimensiones.largo,
        ancho: dimensiones.ancho,
        alto: dimensiones.alto,
        valorDeclarado: displayedSubtotalRef.current,
        contenido: 'Hardware y componentes informáticos',
      })
    }, 600)
    return () => clearTimeout(timer)
  // dimensiones.{largo,ancho,alto} como primitivos para evitar comparación por referencia
  }, [shipping.postalCode, pesoKg, dimensiones.largo, dimensiones.ancho, dimensiones.alto]) // eslint-disable-line react-hooks/exhaustive-deps

  const shippingCost = (cpValido && shippingOpcion) ? parseFloat(shippingOpcion.totalPrice) : 0
  const finalTotal = displayedSubtotal + shippingCost

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-steel/50">
          Tu carrito está vacío
        </p>
        <Link to="/productos">
          <Button size="md">Explorar catálogo</Button>
        </Link>
      </main>
    )
  }

  const updateShipping = (k: keyof Address, v: string) =>
    setShipping((s) => ({ ...s, [k]: v }))
  const updateExtra = (k: keyof ShippingExtra, v: string) =>
    setExtra((e) => ({ ...e, [k]: v }))
  const updateBilling = (k: keyof BillingInfo, v: string) =>
    setBilling((b) => ({ ...b, [k]: v } as BillingInfo))
  const updateBillingAddress = (k: keyof Address, v: string) =>
    setBilling((b) => ({ ...b, billingAddress: { ...b.billingAddress, [k]: v } }))

  // ── Validaciones ──
  const validate = (): boolean => {
    setError('')
    // Shipping
    if (!shipping.street.trim()) { setError('La calle del envío es requerida'); return false }
    if (!shipping.city.trim()) { setError('La ciudad del envío es requerida'); return false }
    if (!shipping.state.trim()) { setError('La provincia del envío es requerida'); return false }
    if (!shipping.postalCode.trim()) { setError('El CP del envío es requerido'); return false }

    // Billing — todos required
    if (!billing.name.trim()) { setError('Nombre o razón social es requerido'); return false }
    if (!billing.taxId.trim()) { setError('CUIT / DNI es requerido'); return false }
    if (!billing.billingAddress.street.trim()) { setError('Calle de facturación es requerida'); return false }
    if (!billing.billingAddress.city.trim()) { setError('Ciudad de facturación es requerida'); return false }
    if (!billing.billingAddress.state.trim()) { setError('Provincia de facturación es requerida'); return false }
    if (!billing.billingAddress.postalCode.trim()) { setError('CP de facturación es requerido'); return false }
    return true
  }

  const handlePay = async () => {
    if (!validate()) return

    setIsProcessing(true)
    try {
      // Limpiar campos vacíos del extra para no enviar strings vacíos
      const cleanedExtra: ShippingExtra = {}
      if (extra.apartment?.trim()) cleanedExtra.apartment = extra.apartment.trim()
      if (extra.phone?.trim()) cleanedExtra.phone = extra.phone.trim()
      if (extra.deliveryNotes?.trim()) cleanedExtra.deliveryNotes = extra.deliveryNotes.trim()

      const response = await startCheckout({
        items: items.map((i) => ({ product: i.product._id, quantity: i.quantity })),
        paymentMethod,
        shippingAddress: shipping,
        shippingExtra: Object.keys(cleanedExtra).length > 0 ? cleanedExtra : undefined,
        billingInfo: billing,
        // Enviar 0 cuando el envío es gratis (no undefined), undefined cuando no hay cotización
        shippingCost: (cpValido && shippingOpcion) ? shippingCost : undefined,
      })

      if (response.paymentMethod === 'transferencia') {
        // Cache rápido en sessionStorage (la URL es la fuente de verdad)
        sessionStorage.setItem(
          'transferCheckout',
          JSON.stringify({
            orderId: response.orderId,
            total: response.total,
            bankInfo: response.bankInfo,
          })
        )
        navigate(`/checkout/transferencia/${response.orderId}`)
        return
      }

      // MP: redirect
      sessionStorage.setItem('pendingOrderId', response.orderId)
      sessionStorage.setItem('isMockPayment', String(response.isMock))
      window.location.href = response.initPoint
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al iniciar el pago. Intentá de nuevo.')
      setIsProcessing(false)
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 pt-24 pb-16">
      <Link
        to="/carrito"
        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-gold transition-colors mb-6"
      >
        <ArrowLeft size={12} />
        Volver al carrito
      </Link>

      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">
          [ Checkout ]
        </p>
        <h1 className="font-display text-[clamp(2rem,6vw,4rem)] uppercase tracking-tightest text-ash">
          Finalizar Compra
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* ── Formularios ── */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Dirección de envío */}
          <section className="border border-steel/20 bg-surface-mid p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-4 flex items-center gap-2">
              <MapPin size={12} />
              Dirección de envío
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input
                  label="Calle y número"
                  value={shipping.street}
                  onChange={(e) => updateShipping('street', e.target.value)}
                  placeholder="Av. Corrientes 1234"
                />
              </div>
              <Input
                label="Ciudad"
                value={shipping.city}
                onChange={(e) => updateShipping('city', e.target.value)}
                placeholder="Buenos Aires"
              />
              <Input
                label="Provincia"
                value={shipping.state}
                onChange={(e) => updateShipping('state', e.target.value)}
                placeholder="CABA"
              />
              <Input
                label="Código postal"
                value={shipping.postalCode}
                onChange={(e) => updateShipping('postalCode', e.target.value)}
                placeholder="1043"
              />
              <Input label="País" value={shipping.country} disabled />
            </div>
          </section>

          {/* Datos adicionales (opcionales) */}
          <section className="border border-steel/15 bg-surface-mid p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel flex items-center gap-2">
                <Plus size={12} />
                Datos adicionales del envío
              </p>
              <span className="font-mono text-[9px] uppercase tracking-widest text-steel/40">
                Opcional
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Piso / Depto"
                value={extra.apartment ?? ''}
                onChange={(e) => updateExtra('apartment', e.target.value)}
                placeholder="3° B"
              />
              <Input
                label="Teléfono de contacto"
                value={extra.phone ?? ''}
                onChange={(e) => updateExtra('phone', e.target.value)}
                placeholder="+54 11 1234-5678"
              />
              <div className="col-span-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-steel block mb-1.5">
                  Notas para el repartidor
                </label>
                <textarea
                  value={extra.deliveryNotes ?? ''}
                  onChange={(e) => updateExtra('deliveryNotes', e.target.value)}
                  rows={2}
                  placeholder="Tocar timbre, dejar con encargado, etc."
                  maxLength={500}
                  className="w-full bg-surface-dark border border-steel/30 text-ash font-mono text-sm px-4 py-3 focus:outline-none focus:border-gold/60 transition-colors resize-y"
                />
              </div>
            </div>
          </section>

          {/* Datos de facturación */}
          <section className="border border-steel/20 bg-surface-mid p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-4 flex items-center gap-2">
              <FileText size={12} />
              Datos de facturación
            </p>

            {/* Info: tipo de factura fijo (monotributista) */}
            <div className="mb-4 px-3 py-2.5 border border-steel/15 bg-surface-dark/40 flex items-center gap-2">
              <FileText size={12} className="text-gold flex-shrink-0" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel/70 leading-relaxed">
                Emitimos <span className="text-gold">Factura C</span> (régimen monotributo)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Input
                label="Razón social / Nombre completo"
                value={billing.name}
                onChange={(e) => updateBilling('name', e.target.value)}
                placeholder="Juan Pérez / Empresa SRL"
              />

              <Input
                label="CUIT / DNI"
                value={billing.taxId}
                onChange={(e) => updateBilling('taxId', e.target.value.replace(/\D/g, ''))}
                placeholder="20123456789"
                maxLength={11}
              />

              <div className="col-span-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-steel block mb-1.5">
                  Tu categoría fiscal
                </label>
                <select
                  value={billing.taxCategory}
                  onChange={(e) => updateBilling('taxCategory', e.target.value)}
                  className="w-full bg-surface-dark border border-steel/30 text-ash font-mono text-sm px-4 py-3 focus:outline-none focus:border-gold/60 transition-colors"
                >
                  {(Object.keys(TAX_CATEGORY_LABELS) as TaxCategory[]).map((tc) => (
                    <option key={tc} value={tc}>{TAX_CATEGORY_LABELS[tc]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Domicilio fiscal (separado del de envío) */}
            <div className="border-t border-steel/15 pt-4 mt-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel/70 mb-3">
                Domicilio fiscal (puede ser distinto al de envío)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Input
                    label="Calle y número"
                    value={billing.billingAddress.street}
                    onChange={(e) => updateBillingAddress('street', e.target.value)}
                  />
                </div>
                <Input
                  label="Ciudad"
                  value={billing.billingAddress.city}
                  onChange={(e) => updateBillingAddress('city', e.target.value)}
                />
                <Input
                  label="Provincia"
                  value={billing.billingAddress.state}
                  onChange={(e) => updateBillingAddress('state', e.target.value)}
                />
                <Input
                  label="Código postal"
                  value={billing.billingAddress.postalCode}
                  onChange={(e) => updateBillingAddress('postalCode', e.target.value)}
                />
                <Input
                  label="País"
                  value={billing.billingAddress.country}
                  onChange={(e) => updateBillingAddress('country', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Método de pago */}
          <section className="border border-steel/20 bg-surface-mid p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-4 flex items-center gap-2">
              <CreditCard size={12} />
              Método de pago
            </p>

            <div className="grid sm:grid-cols-2 gap-2">
              <PaymentMethodCard
                value="mercadopago"
                selected={paymentMethod === 'mercadopago'}
                onSelect={setPaymentMethod}
                title="Mercado Pago"
                description="Tarjeta de crédito / débito · Cuotas sin interés"
                icon={<CreditCard size={18} />}
              />
              <PaymentMethodCard
                value="transferencia"
                selected={paymentMethod === 'transferencia'}
                onSelect={setPaymentMethod}
                title="Transferencia bancaria"
                description="−7% de descuento · Te damos CBU y alias"
                icon={<Building2 size={18} />}
                highlight
              />
            </div>

            <p className="font-mono text-[9px] uppercase tracking-widest text-steel/40 mt-3 leading-relaxed">
              {paymentMethod === 'mercadopago'
                ? 'Al presionar "Pagar" serás redirigido a Mercado Pago para completar la transacción.'
                : 'Al presionar "Confirmar pedido" te mostramos los datos bancarios para transferir.'}
            </p>
          </section>
        </div>

        {/* ── Resumen ── */}
        <aside className="md:col-span-1">
          <div className="border border-steel/20 bg-surface-mid p-5 sticky top-24">
            <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-4">
              [ Tu pedido · {items.length} {items.length === 1 ? 'item' : 'items'} ]
            </p>

            <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product._id} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-steel/40 w-6">×{item.quantity}</span>
                  <span className="flex-1 font-sans text-ash/80 truncate">{item.product.name}</span>
                </div>
              ))}
            </div>

            <div className="h-px bg-steel/15 my-3" />

            <div className="flex justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Subtotal</span>
              <span className="font-mono text-sm text-ash">{formatCurrency(displayedSubtotal)}</span>
            </div>
            {paymentMethod === 'transferencia' && (
              <div className="flex justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                  Descuento transferencia
                </span>
                <span className="font-mono text-xs text-emerald-400">
                  −{formatCurrency(cartTotal - estimatedTransferTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-steel flex items-center gap-1.5">
                <Truck size={10} />
                Envío
              </span>
              <span className="font-mono text-sm text-ash">
                {isQuotingShipping ? (
                  <Loader2 size={11} className="animate-spin text-steel inline" />
                ) : cpValido && shippingOpcion ? (
                  shippingCost === 0
                    ? <span className="text-emerald-400">Gratis</span>
                    : formatCurrency(shippingCost)
                ) : cpValido ? (
                  <Loader2 size={11} className="animate-spin text-steel inline" />
                ) : (
                  <span className="text-steel/40 text-[10px]">Ingresá tu CP</span>
                )}
              </span>
            </div>

            <div className="h-px bg-steel/15 my-3" />

            <div className="flex justify-between mb-5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Total</span>
              <span className="font-mono text-2xl text-gold">{formatCurrency(finalTotal)}</span>
            </div>

            {error && (
              <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest border border-red-500/20 px-3 py-2 mb-3">
                [ Error ] {error}
              </p>
            )}

            <Button
              size="lg"
              className="w-full group"
              onClick={handlePay}
              disabled={isProcessing || (isQuotingShipping && cpValido)}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" />
                  Procesando...
                </>
              ) : (
                <>
                  {paymentMethod === 'transferencia' ? 'Confirmar pedido' : `Pagar ${formatCurrency(finalTotal)}`}
                  <ArrowRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <p className="font-mono text-[9px] uppercase tracking-widest text-steel/30 text-center mt-3">
              Pago seguro · SSL 256-bit
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}

// ───────────────────────────────────────────────────────────
function PaymentMethodCard({
  value,
  selected,
  onSelect,
  title,
  description,
  icon,
  highlight,
}: {
  value: PaymentMethod
  selected: boolean
  onSelect: (m: PaymentMethod) => void
  title: string
  description: string
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'relative text-left p-4 border transition-all duration-200',
        selected
          ? 'border-gold bg-gold/5'
          : 'border-steel/20 hover:border-steel/50 bg-surface-dark/30'
      )}
    >
      {highlight && !selected && (
        <span className="absolute -top-2 right-3 font-mono text-[8px] uppercase tracking-widest bg-emerald-400 text-surface-dark px-1.5 py-0.5">
          −7%
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 flex items-center justify-center flex-shrink-0',
          selected ? 'bg-gold text-surface-dark' : 'bg-surface-dark/60 text-steel'
        )}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={cn('font-sans text-sm font-semibold', selected ? 'text-gold' : 'text-ash')}>
            {title}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel/60 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}
