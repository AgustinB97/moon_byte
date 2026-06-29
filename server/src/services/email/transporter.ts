import nodemailer, { type Transporter } from 'nodemailer'

let cachedTransporter: Transporter | null = null

/**
 * Lazy singleton del transporter de Nodemailer.
 *
 * Usa Gmail SMTP con App Password. El App Password se obtiene desde
 * https://myaccount.google.com/apppasswords (requiere 2FA activado).
 *
 * En producción real, considerar reemplazar Gmail por un proveedor
 * dedicado como Postmark, SendGrid o AWS SES — Gmail tiene límite de
 * 500 emails/día y puede flaggear como spam con altos volúmenes.
 */
export function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error(
      '[EMAIL] SMTP_USER y SMTP_PASS son requeridos. ' +
      'Configurá .env con tu App Password de Gmail.'
    )
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(SMTP_PORT ?? 587),
    secure: false, // STARTTLS en puerto 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  return cachedTransporter
}

/**
 * Verifica que el SMTP esté bien configurado.
 * Útil llamarlo al boot del server para fallar rápido.
 */
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter()
    await transporter.verify()
    return true
  } catch (err) {
    console.error('[EMAIL] Error verificando SMTP:', err instanceof Error ? err.message : err)
    return false
  }
}
