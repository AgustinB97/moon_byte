import 'dotenv/config'
import { verifySmtpConnection } from '../services/email'

async function main() {
  console.log('[TEST] Probando conexión SMTP a Gmail...')
  console.log(`[TEST] Usuario: ${process.env.SMTP_USER}`)
  console.log(`[TEST] Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`)
  console.log('')

  const ok = await verifySmtpConnection()

  if (ok) {
    console.log('  ════════════════════════════════════════')
    console.log('  ✓ SMTP funcionando correctamente')
    console.log('  ════════════════════════════════════════')
    process.exit(0)
  } else {
    console.log('  ════════════════════════════════════════')
    console.log('  ✗ SMTP falló — revisá:')
    console.log('    - 2FA activado en la cuenta Gmail')
    console.log('    - App Password correcto (sin espacios)')
    console.log('    - Cuenta moonbyte.hardware@gmail.com existe')
    console.log('  ════════════════════════════════════════')
    process.exit(1)
  }
}

main()
