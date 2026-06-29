import { getTransporter } from './transporter'
import {
  verificationEmail,
  passwordResetEmail,
  orderConfirmationEmail,
  productApprovalEmail,
  orderStatusEmail,
  shipmentCancelledEmail,
} from './templates'

export { verifySmtpConnection } from './transporter'

interface SendOptions {
  to: string
  subject: string
  html: string
  text: string
}

async function send({ to, subject, html, text }: SendOptions): Promise<void> {
  const smtpUser = process.env.SMTP_USER
  const from = process.env.SMTP_FROM ?? (smtpUser ? `MoonByte <${smtpUser}>` : undefined)
  if (!from) throw new Error('[EMAIL] SMTP_FROM o SMTP_USER debe estar configurado en .env')

  try {
    await getTransporter().sendMail({ from, to, subject, html, text })
    console.log(`[EMAIL] Enviado → ${to} (${subject})`)
  } catch (err) {
    // No tirar — un fallo de email no debería bloquear el flow de auth.
    // Logueamos y dejamos que el caller decida si reintentar.
    console.error(
      `[EMAIL] Falló envío a ${to}:`,
      err instanceof Error ? err.message : err
    )
    throw err
  }
}

// ───────────────────────────────────────────────────────────
// API PÚBLICA
// ───────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string
): Promise<void> {
  const { subject, html, text } = verificationEmail({ name, verifyUrl })
  await send({ to, subject, html, text })
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<void> {
  const { subject, html, text } = passwordResetEmail({ name, resetUrl })
  await send({ to, subject, html, text })
}

interface ProductSnapshot {
  name: string
  slug: string
  brand: string
  cost: number
  priceWithMP: number
  priceCash: number
  description?: string
  category?: string
  stock?: number
  images?: string[]
}

export async function sendProductApproval(
  action: 'create' | 'update' | 'delete',
  approverName: string,
  product: ProductSnapshot,
  approvalUrl: string,
  previous?: ProductSnapshot
): Promise<void> {
  const to = process.env.APPROVAL_EMAIL
  if (!to) {
    console.warn('[EMAIL] APPROVAL_EMAIL no está configurado — no se envió mail de aprobación')
    return
  }

  const { subject, html, text } = productApprovalEmail({
    action,
    approverName,
    product,
    previous,
    approvalUrl,
  })
  await send({ to, subject, html, text })
}

interface BankInfo {
  holder: string
  cbu: string
  alias: string
  bankName: string
}

export async function sendOrderStatusUpdate(
  to: string,
  name: string,
  orderId: string,
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
  trackingUrl: string
): Promise<void> {
  const { subject, html, text } = orderStatusEmail({ name, orderId, status, trackingUrl })
  await send({ to, subject, html, text })
}

export async function sendShipmentCancelled(params: {
  orderId: string
  customerName: string
  customerEmail: string
  shipmentId: number
  trackingNumber?: string
  confirmUrl: string
}): Promise<void> {
  // El mail de confirmación de cancelación va al ADMIN (quien tiene que aprobarla en Envia.com)
  const adminTo = process.env.APPROVAL_EMAIL
  if (!adminTo) {
    console.warn('[EMAIL] APPROVAL_EMAIL no está configurado — no se envió mail de confirmación de cancelación')
    return
  }
  const { subject, html, text } = shipmentCancelledEmail(params)
  // Enviar al admin para que confirme
  await send({ to: adminTo, subject, html, text })
  // Notificar también al cliente que su cancelación está en proceso
  if (params.customerEmail) {
    await send({
      to: params.customerEmail,
      subject: `Cancelación de envío solicitada — MoonByte`,
      html: `<p>Hola ${params.customerEmail}, tu solicitud de cancelación del envío fue recibida y está siendo procesada.</p>`,
      text: `Tu solicitud de cancelación del envío fue recibida y está siendo procesada.\n\n— MoonByte`,
    }).catch((err) => {
      console.error('[EMAIL] Notificación al cliente falló:', err instanceof Error ? err.message : err)
    })
  }
}

export async function sendOrderConfirmation(
  to: string,
  name: string,
  orderId: string,
  items: { name: string; quantity: number; price: number }[],
  total: number,
  trackingUrl?: string,
  bankInfo?: BankInfo
): Promise<void> {
  const { subject, html, text } = orderConfirmationEmail({
    name,
    orderId,
    items,
    total,
    trackingUrl,
    bankInfo,
  })
  await send({ to, subject, html, text })
}
