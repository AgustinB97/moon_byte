import { Link } from 'react-router-dom'
import { XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'

export function CheckoutFailurePage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 pt-16">
      <div className="fixed inset-0 grid-line opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-md text-center">
        <div className="bg-surface-mid border border-steel/20 p-8">
          <XCircle size={40} className="text-red-400 mx-auto mb-4" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-red-400 mb-2">
            [ Pago rechazado ]
          </p>
          <h1 className="font-display text-3xl uppercase tracking-tightest text-ash mb-2">
            No pudimos<br />procesar el pago
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel mb-6 leading-relaxed">
            Tu carrito sigue intacto. Podés intentarlo de nuevo con otro método de pago.
          </p>

          <div className="flex flex-col gap-2">
            <Link to="/checkout">
              <Button size="lg" className="w-full">Intentar de nuevo</Button>
            </Link>
            <Link to="/carrito">
              <Button variant="outline" size="md" className="w-full">
                <ArrowLeft size={12} className="mr-1" />
                Volver al carrito
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
