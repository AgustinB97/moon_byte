/**
 * Templates de email con branding MoonByte.
 *
 * Reglas para emails que NO se rompen en clientes (Gmail / Outlook / Apple Mail):
 *  - Solo HTML con tablas (Outlook ignora flexbox/grid)
 *  - CSS INLINE — Gmail strippea <style> en algunos casos
 *  - Sin web fonts (algunos clientes los bloquean)
 *  - Imágenes con URL absoluta + alt
 *  - Plain text fallback siempre
 */

interface BrandedTemplateProps {
  preheader: string
  title: string
  bodyHtml: string
  ctaText?: string
  ctaUrl?: string
  footnote?: string
}

function brandedTemplate(p: BrandedTemplateProps): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MoonByte</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0b0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#f4efe6;">

<!-- Preheader (texto invisible que aparece en preview de inbox) -->
<div style="display:none;font-size:1px;color:#0b0b0d;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${p.preheader}
</div>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0b0b0d;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <!-- Container 600px -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#1f1f23;border:1px solid #2a2a30;">

        <!-- Header / Logo -->
        <tr>
          <td style="padding:32px 32px 24px;border-bottom:1px solid #2a2a30;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background-color:#ff6a00;width:32px;height:32px;text-align:center;vertical-align:middle;color:#0b0b0d;font-weight:900;font-size:18px;line-height:32px;">◗</td>
                      <td style="padding-left:12px;">
                        <div style="font-weight:900;font-size:16px;letter-spacing:-0.02em;text-transform:uppercase;color:#f4efe6;line-height:1;">MoonByte</div>
                        <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#ff6a00;margin-top:2px;">PC Hardware</div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;">
                  [ MB-CORE-01 ]
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 32px 32px;">

            <!-- Title -->
            <h1 style="margin:0 0 24px;font-size:32px;font-weight:900;line-height:1;text-transform:uppercase;letter-spacing:-0.03em;color:#f4efe6;">
              ${p.title}
            </h1>

            <!-- Body content -->
            <div style="font-size:15px;line-height:1.6;color:#d8d3cb;">
              ${p.bodyHtml}
            </div>

            ${
              p.ctaText && p.ctaUrl
                ? `<!-- CTA Button -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0 24px;">
              <tr>
                <td style="background-color:#ff6a00;">
                  <a href="${p.ctaUrl}" target="_blank"
                     style="display:inline-block;padding:14px 32px;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0b0b0d;text-decoration:none;font-family:'Courier New',monospace;">
                    ${p.ctaText} →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Plain link fallback -->
            <p style="margin:16px 0 0;font-size:11px;line-height:1.5;color:#6b6b72;font-family:'Courier New',monospace;">
              ¿No funciona el botón? Copiá este link:<br>
              <a href="${p.ctaUrl}" style="color:#ff6a00;text-decoration:none;word-break:break-all;">${p.ctaUrl}</a>
            </p>`
                : ''
            }

            ${
              p.footnote
                ? `<div style="margin-top:32px;padding-top:24px;border-top:1px solid #2a2a30;font-size:12px;line-height:1.5;color:#6b6b72;">
              ${p.footnote}
            </div>`
                : ''
            }

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #2a2a30;background-color:#0b0b0d;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#4a4a52;">
                  © 2026 MoonByte — PC Hardware Store
                </td>
                <td align="right" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#4a4a52;">
                  /// ARG-01
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`
}

// ───────────────────────────────────────────────────────────
// TEMPLATES PÚBLICOS
// ───────────────────────────────────────────────────────────

interface VerificationParams {
  name: string
  verifyUrl: string
}

export function verificationEmail(p: VerificationParams) {
  return {
    subject: 'Confirmá tu email — MoonByte',
    html: brandedTemplate({
      preheader: 'Activá tu cuenta en MoonByte haciendo click en el link.',
      title: 'Confirmá<br>tu email',
      bodyHtml: `
        <p style="margin:0 0 16px;">Hola <strong style="color:#f4efe6;">${escapeHtml(p.name)}</strong>,</p>
        <p style="margin:0 0 16px;">Gracias por registrarte en MoonByte. Para activar tu cuenta y poder iniciar sesión, confirmá tu dirección de email haciendo click en el botón:</p>
      `,
      ctaText: 'Confirmar email',
      ctaUrl: p.verifyUrl,
      footnote: `
        <p style="margin:0;">Este link expira en <strong style="color:#ff6a00;">24 horas</strong>.</p>
        <p style="margin:8px 0 0;">Si no creaste esta cuenta, ignorá este mensaje — no se enviarán más emails.</p>
      `,
    }),
    text: `Hola ${p.name},

Gracias por registrarte en MoonByte. Para activar tu cuenta y poder iniciar sesión, confirmá tu email visitando:

${p.verifyUrl}

Este link expira en 24 horas.
Si no creaste esta cuenta, ignorá este mensaje.

— MoonByte`,
  }
}

interface PasswordResetParams {
  name: string
  resetUrl: string
}

export function passwordResetEmail(p: PasswordResetParams) {
  return {
    subject: 'Restablecé tu contraseña — MoonByte',
    html: brandedTemplate({
      preheader: 'Solicitaste restablecer tu contraseña. Hace click para crear una nueva.',
      title: 'Restablecer<br>contraseña',
      bodyHtml: `
        <p style="margin:0 0 16px;">Hola <strong style="color:#f4efe6;">${escapeHtml(p.name)}</strong>,</p>
        <p style="margin:0 0 16px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé click en el botón para crear una nueva contraseña:</p>
      `,
      ctaText: 'Crear nueva contraseña',
      ctaUrl: p.resetUrl,
      footnote: `
        <p style="margin:0;">Este link expira en <strong style="color:#ff6a00;">1 hora</strong>.</p>
        <p style="margin:8px 0 0;">Si <strong>no solicitaste</strong> este cambio, ignorá este email — tu contraseña actual sigue siendo válida y nadie puede acceder a tu cuenta sin ella.</p>
      `,
    }),
    text: `Hola ${p.name},

Recibimos una solicitud para restablecer la contraseña de tu cuenta MoonByte. Visitá este link para crear una nueva:

${p.resetUrl}

Este link expira en 1 hora.
Si no solicitaste este cambio, ignorá este email.

— MoonByte`,
  }
}

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderConfirmationParams {
  name: string
  orderId: string
  items: OrderItem[]
  total: number
  trackingUrl?: string
  bankInfo?: {
    holder: string
    cbu: string
    alias: string
    bankName: string
  }
}

const currency = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(n)

export function orderConfirmationEmail(p: OrderConfirmationParams) {
  const orderShort = p.orderId.slice(-6).toUpperCase()

  // Bloque bancario (solo si es transferencia)
  const bankBlockHtml = p.bankInfo
    ? `
      <div style="margin:24px 0;padding:20px;border:1px solid #ff6a00;background-color:rgba(255,106,0,0.05);">
        <p style="margin:0 0 12px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#ff6a00;">
          [ Datos para tu transferencia ]
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6b72;width:35%;">Banco</td>
            <td style="padding:6px 0;font-size:13px;color:#f4efe6;">${escapeHtml(p.bankInfo.bankName)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6b72;">Titular</td>
            <td style="padding:6px 0;font-size:13px;color:#f4efe6;">${escapeHtml(p.bankInfo.holder)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6b72;">CBU</td>
            <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:13px;color:#f4efe6;">${escapeHtml(p.bankInfo.cbu)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6b72;">Alias</td>
            <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:13px;color:#ff6a00;font-weight:bold;">${escapeHtml(p.bankInfo.alias)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6b72;">Concepto</td>
            <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:13px;color:#f4efe6;">#${orderShort}</td>
          </tr>
          <tr>
            <td style="padding:10px 0 0;border-top:1px solid #2a2a30;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#f4efe6;font-weight:bold;">Monto a transferir</td>
            <td align="right" style="padding:10px 0 0;border-top:1px solid #2a2a30;font-family:'Courier New',monospace;font-size:18px;color:#ff6a00;font-weight:bold;">${currency(p.total)}</td>
          </tr>
        </table>
        <p style="margin:14px 0 0;font-size:11px;line-height:1.5;color:#d8d3cb;">
          Cuando termines, volvé a tu pedido y subí el comprobante:
        </p>
      </div>
    `
    : ''

  const itemsHtml = p.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a30;font-size:14px;color:#f4efe6;">
          ${escapeHtml(item.name)}
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6b72;margin-top:2px;">×${item.quantity}</div>
        </td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid #2a2a30;font-family:'Courier New',monospace;font-size:14px;color:#ff6a00;white-space:nowrap;">
          ${currency(item.price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join('')

  const itemsText = p.items
    .map((i) => `  • ${i.name} ×${i.quantity}  →  ${currency(i.price * i.quantity)}`)
    .join('\n')

  const subjectPrefix = p.bankInfo ? 'Esperando transferencia' : 'Pedido confirmado'
  const titleHtml = p.bankInfo ? 'Pedido<br>recibido' : 'Pedido<br>confirmado'
  const intro = p.bankInfo
    ? 'Recibimos tu pedido. Está pendiente hasta que recibamos tu transferencia.'
    : 'Recibimos tu pedido. Lo estamos preparando para envío en las próximas 24hs.'

  return {
    subject: `${subjectPrefix} #${orderShort} — MoonByte`,
    html: brandedTemplate({
      preheader: p.bankInfo
        ? `Datos para transferir ${currency(p.total)} — pedido #${orderShort}`
        : `Recibimos tu pedido por ${currency(p.total)}. Estamos preparando tu envío.`,
      title: titleHtml,
      bodyHtml: `
        <p style="margin:0 0 8px;">Hola <strong style="color:#f4efe6;">${escapeHtml(p.name)}</strong>,</p>
        <p style="margin:0 0 24px;">${intro}</p>

        <!-- Order code -->
        <div style="margin:0 0 24px;padding:12px 16px;border:1px solid #2a2a30;background-color:#0b0b0d;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;">
          <span style="color:#ff6a00;">[ Order ID ]</span>  ${p.orderId.toUpperCase()}
        </div>

        ${bankBlockHtml}

        <!-- Items table -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td style="padding-bottom:8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;border-bottom:1px solid #ff6a00;">PRODUCTO</td>
            <td align="right" style="padding-bottom:8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;border-bottom:1px solid #ff6a00;">SUBTOTAL</td>
          </tr>
          ${itemsHtml}
          <tr>
            <td style="padding-top:16px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#f4efe6;">TOTAL</td>
            <td align="right" style="padding-top:16px;font-family:'Courier New',monospace;font-size:20px;color:#ff6a00;">${currency(p.total)}</td>
          </tr>
        </table>
      `,
      ctaText: p.trackingUrl ? (p.bankInfo ? 'Subir comprobante' : 'Ver estado del pedido') : undefined,
      ctaUrl: p.trackingUrl,
      footnote: p.bankInfo
        ? `
        <p style="margin:0;">Apenas confirmemos tu transferencia, despachamos el pedido. Si tenés dudas, escribinos a <a href="mailto:moonbyte.hardware@gmail.com" style="color:#ff6a00;text-decoration:none;">moonbyte.hardware@gmail.com</a>.</p>
      `
        : `
        <p style="margin:0;">Recibirás otro email cuando tu pedido sea despachado, con el código de seguimiento.</p>
        <p style="margin:8px 0 0;">¿Dudas sobre tu pedido? Respondé este mail o escribinos a <a href="mailto:moonbyte.hardware@gmail.com" style="color:#ff6a00;text-decoration:none;">moonbyte.hardware@gmail.com</a>.</p>
      `,
    }),
    text: `Hola ${p.name},

${intro}

ORDER ID: ${p.orderId.toUpperCase()}

${
  p.bankInfo
    ? `DATOS PARA TRANSFERIR:
  Banco:    ${p.bankInfo.bankName}
  Titular:  ${p.bankInfo.holder}
  CBU:      ${p.bankInfo.cbu}
  Alias:    ${p.bankInfo.alias}
  Concepto: #${orderShort}
  MONTO:    ${currency(p.total)}

`
    : ''
}PRODUCTOS:
${itemsText}

TOTAL: ${currency(p.total)}

${p.bankInfo ? 'Cuando termines, subí el comprobante desde Mis Pedidos.' : 'Recibirás otro email cuando tu pedido sea despachado.'}

— MoonByte`,
  }
}

// ───────────────────────────────────────────────────────────
// PRODUCT APPROVAL TEMPLATES
// ───────────────────────────────────────────────────────────

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

interface ApprovalParams {
  action: 'create' | 'update' | 'delete'
  approverName: string
  product: ProductSnapshot
  previous?: ProductSnapshot // Para 'update'
  approvalUrl: string
}

const ACTION_TITLE: Record<ApprovalParams['action'], string> = {
  create: 'Nuevo<br>Producto',
  update: 'Cambio<br>de Precio',
  delete: 'Eliminar<br>Producto',
}

const ACTION_LABEL: Record<ApprovalParams['action'], string> = {
  create: 'Crear producto',
  update: 'Actualizar producto',
  delete: 'Eliminar producto',
}

const ACTION_CTA: Record<ApprovalParams['action'], string> = {
  create: 'Aprobar creación',
  update: 'Aprobar cambios',
  delete: 'Aprobar eliminación',
}

const currencyARS = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(n)

function diffRow(label: string, oldVal: string | number, newVal: string | number): string {
  const oldStr = typeof oldVal === 'number' ? currencyARS(oldVal) : escapeHtml(String(oldVal))
  const newStr = typeof newVal === 'number' ? currencyARS(newVal) : escapeHtml(String(newVal))
  const changed = oldVal !== newVal
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2a2a30;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6b72;width:40%;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2a2a30;font-size:12px;color:${changed ? '#6b6b72' : '#d8d3cb'};text-decoration:${changed ? 'line-through' : 'none'};">${oldStr}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2a2a30;font-size:13px;color:${changed ? '#ff6a00' : '#d8d3cb'};font-weight:${changed ? 'bold' : 'normal'};">${newStr}</td>
    </tr>`
}

function productInfoBlock(p: ProductSnapshot): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;border:1px solid #2a2a30;background-color:#0b0b0d;">
      ${
        p.images?.[0]
          ? `<tr><td style="padding:0;"><img src="${escapeHtml(p.images[0])}" alt="${escapeHtml(p.name)}" width="568" style="display:block;width:100%;max-width:568px;height:auto;border-bottom:1px solid #2a2a30;" /></td></tr>`
          : ''
      }
      <tr>
        <td style="padding:16px 20px;">
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#ff6a00;margin-bottom:4px;">${escapeHtml(p.brand)}</div>
          <div style="font-size:16px;font-weight:bold;color:#f4efe6;line-height:1.3;margin-bottom:6px;">${escapeHtml(p.name)}</div>
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6b72;">${escapeHtml(p.slug)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px 16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding-top:10px;border-top:1px solid #2a2a30;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;">Costo</td>
              <td align="right" style="padding-top:10px;border-top:1px solid #2a2a30;font-family:'Courier New',monospace;font-size:13px;color:#d8d3cb;">${currencyARS(p.cost)}</td>
            </tr>
            <tr>
              <td style="padding-top:10px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;">Precio transferencia</td>
              <td align="right" style="padding-top:10px;font-family:'Courier New',monospace;font-size:13px;color:#d8d3cb;">${currencyARS(p.priceCash)}</td>
            </tr>
            <tr>
              <td style="padding-top:10px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#f4efe6;font-weight:bold;">Precio con MP</td>
              <td align="right" style="padding-top:10px;font-family:'Courier New',monospace;font-size:16px;color:#ff6a00;font-weight:bold;">${currencyARS(p.priceWithMP)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

export function productApprovalEmail(p: ApprovalParams) {
  const isDanger = p.action === 'delete'

  let bodyHtml = `
    <p style="margin:0 0 16px;"><strong style="color:#f4efe6;">${escapeHtml(p.approverName)}</strong> solicita una operación de ${ACTION_LABEL[p.action]} que necesita tu aprobación.</p>
  `

  if (p.action === 'create' || p.action === 'delete') {
    bodyHtml += productInfoBlock(p.product)
  } else if (p.action === 'update' && p.previous) {
    // Mostrar tabla de diff
    bodyHtml += `
      <p style="margin:24px 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#ff6a00;">[ Cambios propuestos ]</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
        <tr>
          <th style="padding-bottom:8px;border-bottom:1px solid #ff6a00;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;text-align:left;">Campo</th>
          <th style="padding-bottom:8px;border-bottom:1px solid #ff6a00;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;text-align:left;">Actual</th>
          <th style="padding-bottom:8px;border-bottom:1px solid #ff6a00;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;text-align:left;">Propuesto</th>
        </tr>
        ${diffRow('Nombre', p.previous.name, p.product.name)}
        ${diffRow('Marca', p.previous.brand, p.product.brand)}
        ${diffRow('Costo', p.previous.cost, p.product.cost)}
        ${diffRow('Precio transferencia', p.previous.priceCash, p.product.priceCash)}
        ${diffRow('Precio con MP', p.previous.priceWithMP, p.product.priceWithMP)}
        ${diffRow('Stock', p.previous.stock ?? 0, p.product.stock ?? 0)}
      </table>
    `
  }

  if (isDanger) {
    bodyHtml += `
      <div style="margin:16px 0;padding:12px 16px;border:1px solid #ff6a00;background-color:rgba(255,106,0,0.08);">
        <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#ff6a00;margin-bottom:4px;">⚠ Acción destructiva</div>
        <div style="font-size:12px;color:#d8d3cb;">Si aprobás, el producto se elimina del catálogo permanentemente, incluyendo sus imágenes de Cloudinary.</div>
      </div>
    `
  }

  return {
    subject: `[MoonByte] ${ACTION_LABEL[p.action]}: ${p.product.name}`,
    html: brandedTemplate({
      preheader: `${p.approverName} solicita ${ACTION_LABEL[p.action].toLowerCase()}: ${p.product.name}`,
      title: ACTION_TITLE[p.action],
      bodyHtml,
      ctaText: ACTION_CTA[p.action],
      ctaUrl: p.approvalUrl,
      footnote: `
        <p style="margin:0;">Este link expira en <strong style="color:#ff6a00;">24 horas</strong> y es de un solo uso.</p>
        <p style="margin:8px 0 0;">Si <strong>no fuiste vos</strong> o no autorizaste este cambio, ignorá este mail — la operación se descartará automáticamente.</p>
      `,
    }),
    text: `[MoonByte] ${ACTION_LABEL[p.action]}: ${p.product.name}

${p.approverName} solicita ${ACTION_LABEL[p.action].toLowerCase()}.

Producto: ${p.product.name} (${p.product.slug})
Costo: ${currencyARS(p.product.cost)}
Precio transferencia: ${currencyARS(p.product.priceCash)}
Precio con MP: ${currencyARS(p.product.priceWithMP)}

Aprobar: ${p.approvalUrl}

Este link expira en 24h. Si no fuiste vos, ignorá este mail.

— MoonByte`,
  }
}

// ───────────────────────────────────────────────────────────
// ORDER STATUS UPDATE
// ───────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface OrderStatusParams {
  name: string
  orderId: string
  status: OrderStatus
  trackingUrl: string
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  processing: 'Confirmado',
  shipped: 'Despachado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_MESSAGE: Record<OrderStatus, string> = {
  pending: 'Tu pedido está en revisión.',
  processing: 'Tu pedido fue confirmado y lo estamos preparando para despachar en las próximas 24hs.',
  shipped: '¡Tu pedido acaba de ser despachado! Pronto va a estar en tus manos.',
  delivered: '¡Tu pedido fue entregado! Gracias por comprar en MoonByte.',
  cancelled: 'Tu pedido fue cancelado. Si tenés dudas o preguntas, escribinos a <a href="mailto:moonbyte.hardware@gmail.com" style="color:#ff6a00;text-decoration:none;">moonbyte.hardware@gmail.com</a>.',
}

export function orderStatusEmail(p: OrderStatusParams) {
  const label = STATUS_LABEL[p.status]
  const message = STATUS_MESSAGE[p.status]
  const orderShort = p.orderId.slice(-6).toUpperCase()

  return {
    subject: `Pedido #${orderShort} — ${label} | MoonByte`,
    html: brandedTemplate({
      preheader: `Tu pedido #${orderShort} cambió de estado: ${label}`,
      title: `Pedido<br>${escapeHtml(label)}`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Hola <strong style="color:#f4efe6;">${escapeHtml(p.name)}</strong>,</p>
        <p style="margin:0 0 24px;">${message}</p>

        <div style="margin:0 0 24px;padding:12px 16px;border:1px solid #2a2a30;background-color:#0b0b0d;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;">
          <span style="color:#ff6a00;">[ Orden de compra ]</span>  #${orderShort}
        </div>

        <div style="padding:10px 16px;display:inline-block;border:1px solid #ff6a00;background-color:rgba(255,106,0,0.08);font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#ff6a00;">
          ● ${escapeHtml(label)}
        </div>
      `,
      ctaText: 'Ver mi pedido',
      ctaUrl: p.trackingUrl,
    }),
    text: `Hola ${p.name},

${message.replace(/<[^>]*>/g, '')}

ORDEN DE COMPRA: #${orderShort}
ESTADO: ${label}

Ver pedido: ${p.trackingUrl}

— MoonByte`,
  }
}

// ───────────────────────────────────────────────────────────
// SHIPMENT CANCELLED (notificación interna al APPROVAL_EMAIL)
// ───────────────────────────────────────────────────────────

interface ShipmentCancelledParams {
  orderId: string
  customerName: string
  customerEmail: string
  shipmentId: number
  trackingNumber?: string
  confirmUrl: string
}

export function shipmentCancelledEmail(p: ShipmentCancelledParams) {
  const orderShort = p.orderId.slice(-6).toUpperCase()

  return {
    subject: `[MoonByte Admin] Confirmar cancelación de envío — Pedido #${orderShort}`,
    html: brandedTemplate({
      preheader: `Confirmá la cancelación del envío del pedido #${orderShort} en Envia.com.`,
      title: 'Confirmar<br>cancelación',
      bodyHtml: `
        <p style="margin:0 0 16px;">Desde el panel de administración se solicitó <strong style="color:#ff6a00;">cancelar el envío</strong> del siguiente pedido en Envia.com.</p>
        <p style="margin:0 0 24px;">Si fuiste vos, hacé clic en el botón para confirmar. Si no, ignorá este mail — el envío <strong style="color:#f4efe6;">no se cancelará</strong>.</p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;border:1px solid #2a2a30;background-color:#0b0b0d;">
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #2a2a30;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;width:40%;">Pedido</td>
            <td style="padding:10px 16px;border-bottom:1px solid #2a2a30;font-family:'Courier New',monospace;font-size:13px;color:#ff6a00;">#${orderShort}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #2a2a30;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;">Cliente</td>
            <td style="padding:10px 16px;border-bottom:1px solid #2a2a30;font-size:13px;color:#f4efe6;">${escapeHtml(p.customerName)} <span style="color:#6b6b72;">(${escapeHtml(p.customerEmail)})</span></td>
          </tr>
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #2a2a30;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;">Shipment ID</td>
            <td style="padding:10px 16px;border-bottom:1px solid #2a2a30;font-family:'Courier New',monospace;font-size:13px;color:#f4efe6;">${p.shipmentId}</td>
          </tr>
          ${p.trackingNumber ? `
          <tr>
            <td style="padding:10px 16px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6b72;">Tracking</td>
            <td style="padding:10px 16px;font-family:'Courier New',monospace;font-size:13px;color:#f4efe6;">${escapeHtml(p.trackingNumber)}</td>
          </tr>` : ''}
        </table>
      `,
      ctaText: 'Confirmar cancelación',
      ctaUrl: p.confirmUrl,
      footnote: `
        <p style="margin:0;">Este link es de <strong style="color:#ff6a00;">un solo uso</strong> y expira en 24 horas.</p>
        <p style="margin:8px 0 0;">Si <strong>no solicitaste</strong> esta cancelación, ignorá este mail — el envío seguirá activo en Envia.com.</p>
      `,
    }),
    text: `[MoonByte Admin] Confirmar cancelación de envío — Pedido #${orderShort}

Desde el panel se solicitó cancelar el envío. Confirmá haciendo clic en el link:

${p.confirmUrl}

PEDIDO:      #${orderShort}
CLIENTE:     ${p.customerName} (${p.customerEmail})
SHIPMENT ID: ${p.shipmentId}
${p.trackingNumber ? `TRACKING:    ${p.trackingNumber}\n` : ''}
Este link es de un solo uso y expira en 24 horas.
Si no solicitaste esta cancelación, ignorá este mail.

— MoonByte Admin`,
  }
}

// ───────────────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
