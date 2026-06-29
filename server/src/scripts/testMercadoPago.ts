/**
 * Script de verificación del sandbox de MercadoPago.
 *
 * Qué hace:
 *  1. Valida que MP_ACCESS_TOKEN esté seteado y sea un token de prueba (TEST-...)
 *  2. Crea dos usuarios de prueba: vendedor y comprador
 *     (este paso también verifica que el token sea funcional)
 *
 * Uso:
 *   npm run test:mp
 *
 * Requiere en .env:
 *   MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxx
 */

import 'dotenv/config'

const BASE_URL = 'https://api.mercadopago.com'

interface MPTestUser {
  id: number
  nickname: string
  password: string
  site_status: string
  email: string
}

interface MPErrorResponse {
  message?: string
  error?: string
  status?: number
  cause?: { code: number; description: string }[]
}

// ─────────────────────────────────────────────────────────────
// Helper: request autenticado a la API de MP
// ─────────────────────────────────────────────────────────────
async function mpFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = process.env.MP_ACCESS_TOKEN!
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `moonbyte-test-${Date.now()}-${Math.random()}`,
      ...options.headers,
    },
  })

  const json = (await res.json()) as T | MPErrorResponse

  if (!res.ok) {
    const err = json as MPErrorResponse
    throw new Error(`MP API ${res.status}: ${err.message ?? err.error ?? JSON.stringify(err)}`)
  }

  return json as T
}

// ─────────────────────────────────────────────────────────────
// 1. Validar token (solo formato — sin llamada a la API)
// ─────────────────────────────────────────────────────────────
function validateToken(): void {
  const token = process.env.MP_ACCESS_TOKEN

  if (!token) {
    console.error('  ✗ MP_ACCESS_TOKEN no está en el .env')
    console.error('    Generalo en: https://www.mercadopago.com.ar/developers/panel/app')
    console.error('    → tu app → Credenciales de prueba → Access Token')
    process.exit(1)
  }

  if (!token.startsWith('TEST-')) {
    console.error('  ✗ El token parece ser de PRODUCCIÓN (no empieza con TEST-)')
    console.error('    Usá el token de PRUEBA. Los de producción empiezan con APP_USR-')
    process.exit(1)
  }

  if (token.length < 60) {
    console.error(`  ✗ Token demasiado corto (${token.length} chars, debería ser 80+)`)
    console.error('    Probablemente quedó cortado al copiar.')
    process.exit(1)
  }

  if (/\s/.test(token)) {
    console.error('  ✗ El token tiene espacios o saltos de línea')
    console.error('    En el .env debe ser una sola línea sin comillas:')
    console.error('      MP_ACCESS_TOKEN=TEST-xxx...')
    process.exit(1)
  }

  console.log(`  ✓ Formato válido: ${token.slice(0, 12)}... (${token.length} chars)`)
}

// ─────────────────────────────────────────────────────────────
// 2. Crear usuario de prueba (también valida el token)
// ─────────────────────────────────────────────────────────────
async function createTestUser(role: 'vendedor' | 'comprador'): Promise<MPTestUser> {
  const user = await mpFetch<MPTestUser>('/users/test', {
    method: 'POST',
    body: JSON.stringify({ site_id: 'MLA' }),
  })
  console.log(`  ✓ Usuario (${role}):`)
  console.log(`      Email:    ${user.email}`)
  console.log(`      Password: ${user.password}`)
  console.log(`      ID:       ${user.id}`)
  return user
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('')
  console.log('  ══════════════════════════════════════════════')
  console.log('   MoonByte — Test de sandbox MercadoPago')
  console.log('  ══════════════════════════════════════════════')
  console.log('')

  // 1. Validar formato del token
  console.log('  [ 1 / 2 ] Validando token...')
  validateToken()
  console.log('')

  // 2. Crear usuarios de prueba
  console.log('  [ 2 / 2 ] Creando usuarios de prueba...')
  console.log('  (este paso verifica que el token funcione contra la API de MP)')
  console.log('')

  let seller: MPTestUser
  let buyer: MPTestUser

  try {
    seller = await createTestUser('vendedor')
    console.log('')
    buyer = await createTestUser('comprador')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  ✗ Error: ${msg}`)
    console.error('')

    if (msg.includes('401')) {
      console.error('  → Token inválido o expirado.')
      console.error('    En el panel de MP: tu app → Credenciales de prueba → Renovar token')
    } else if (msg.includes('403')) {
      console.error('  → El token no tiene permiso para crear usuarios de prueba.')
      console.error('    Esto pasa cuando la app fue creada con una cuenta distinta')
      console.error('    a la que generó el token. Solución:')
      console.error('    1. Entrá al panel con la cuenta propietaria de la app')
      console.error('    2. Regenerá el Access Token de prueba')
      console.error('    3. Actualizá MP_ACCESS_TOKEN en el .env')
      console.error('')
      console.error('    Alternativa: creá los usuarios de prueba directo desde el panel:')
      console.error('    https://www.mercadopago.com.ar/developers/panel/test-users')
    } else if (msg.includes('Too many')) {
      console.error('  → Llegaste al límite de 10 usuarios de prueba.')
      console.error('    Eliminá algunos en: https://www.mercadopago.com.ar/developers/panel/test-users')
    }

    process.exit(1)
  }

  // ── Resumen ──────────────────────────────────────────────
  console.log('')
  console.log('  ══════════════════════════════════════════════')
  console.log('   ✓ Todo listo para testear')
  console.log('  ══════════════════════════════════════════════')
  console.log('')
  console.log('  PRÓXIMOS PASOS:')
  console.log('')
  console.log('  1. Corrés el server:    cd server && npm run dev')
  console.log('  2. Corrés el cliente:   cd client && npm run dev')
  console.log('  3. Exponés el server con ngrok (para recibir webhooks):')
  console.log('       npx ngrok http 5000')
  console.log('     Agregás al .env del server:')
  console.log('       MP_WEBHOOK_URL=https://TU-URL.ngrok-free.app/api/orders/webhook')
  console.log('')
  console.log('  4. En el checkout, iniciá sesión en MP con el COMPRADOR:')
  console.log(`       Email:    ${buyer.email}`)
  console.log(`       Password: ${buyer.password}`)
  console.log('')
  console.log('  5. Usá estas tarjetas de prueba (cualquier fecha futura, DNI: 12345678):')
  console.log('')
  console.log('     ✅ Aprobado:  4509 9535 6623 3704  CVV: 123  Titular: APRO')
  console.log('     ❌ Rechazado: 4000 0000 0000 0002  CVV: 123  Titular: CALL')
  console.log('     ⏳ Pendiente: 4235 6477 2802 5682  CVV: 123  Titular: CONT')
  console.log('')
  console.log('  USUARIO VENDEDOR (para ver los cobros en el panel de MP):')
  console.log(`       Email:    ${seller.email}`)
  console.log(`       Password: ${seller.password}`)
  console.log('')
  console.log('  ══════════════════════════════════════════════')
  console.log('')
}

main().catch((err: unknown) => {
  console.error('[FATAL]', err instanceof Error ? err.message : err)
  process.exit(1)
})
