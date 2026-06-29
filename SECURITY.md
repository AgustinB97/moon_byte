# Modelo de seguridad — MoonByte

## TL;DR — datos de pago

**Cero datos de tarjeta tocan nuestro código.** Usamos Mercado Pago Checkout Pro,
que es un flujo redirect: el cliente sale de nuestro dominio, paga en MP
(servidores PCI-DSS Level 1), y vuelve solo con un `payment_id`. Después
nosotros consultamos a la API de MP para verificar que el pago fue real.

```
Usuario → Frontend MoonByte → Backend MoonByte → MP Preference API
                                                         ↓
                                                    init_point URL
                                                         ↓
Usuario ────────────────────── REDIRECT ──────────→ MP Checkout (card, CVV, etc)
                                                         ↓
Usuario ←──── REDIRECT con payment_id ─────────────┘
   ↓
Frontend → Backend: confirmOrder(orderId, paymentId)
                              ↓
                       MP Payment API (verifyPayment)
                              ↓
                       status === 'approved' AND
                       external_reference === orderId
                              ↓
                       Orden marcada como pagada
```

## Qué datos manejamos vs cuáles NO

### ❌ NO almacenamos en ningún lado

| Dato | Por qué |
|------|---------|
| Número de tarjeta | Lo captura MP en su iframe propio |
| CVV / código de seguridad | MP, nunca lo recibimos |
| Vencimiento | MP |
| Datos del titular | MP |

### ✅ Sí almacenamos, pero protegidos

| Dato | Dónde | Cómo |
|------|-------|------|
| Email | MongoDB `users.email` | `unique: true`, `lowercase`, validado con regex |
| Password | MongoDB `users.password` | bcrypt con 12 rounds + `select: false` (nunca se devuelve) |
| Dirección de envío | MongoDB `orders.shippingAddress` | Solo accesible al user dueño + admin |
| Order total / items | MongoDB `orders` | Mismo scope que arriba |
| JWT | localStorage del navegador | Solo el user en su browser (ver trade-off abajo) |

## Defensas por capa

### 1. Endpoint de confirmación (`POST /api/orders/confirm`)

**Sin esto**: un attacker logueado puede crear una orden pending y confirmarla sin pagar nunca.

**Defensa**: el backend recibe `{ orderId, paymentId }` y antes de marcar
processing, llama a la API de MP para verificar:
- `payment.status === 'approved'` (pago real)
- `payment.external_reference === orderId` (no es payment de otra orden)

```ts
// orderController.ts → confirmOrder
const verification = await verifyPayment(paymentId)
if (!verification.approved) return 402
if (verification.externalReference !== orderId) return 403  // intento de hijacking
```

### 2. Webhook de Mercado Pago (`POST /api/orders/webhook`)

**Sin esto**: cualquiera con la URL del webhook puede mandar POSTs falsos
diciendo "este pago fue aprobado" y confirmar órdenes que nunca se pagaron.

**Defensa**: validamos el header `x-signature` con HMAC-SHA256 usando
`MP_WEBHOOK_SECRET`. Si la firma no matchea, devolvemos 401 y no procesamos.

```ts
// mercadopago.ts → verifyWebhookSignature
const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
```

### 3. Rate limiting

| Endpoint | Límite |
|----------|--------|
| `/api/auth/login` | 5 / 15 min |
| `/api/auth/register` | 5 / 15 min |
| `/api/auth/forgot-password` | 5 / 15 min |
| `/api/auth/reset-password` | 5 / 15 min |
| `/api/auth/verify/*` | 20 / 5 min |
| `/api/orders/checkout` | 10 / 10 min |
| `/api/orders/confirm` | 10 / 10 min |

Previene brute-force de passwords, spam de emails de recovery y abuso del checkout.

### 4. Validación + sanitización

- `express-validator` en todos los inputs antes de tocar la DB.
- Emails normalizados (`normalizeEmail()`) — no se puede registrar
  `Juan@test.com` y `juan@test.com` como cuentas distintas.
- Tokens de verificación/reset son hex de exactamente 64 caracteres
  (`isHexadecimal().isLength({ min: 64, max: 64 })`) — el regex rechaza
  cualquier formato distinto antes de tocar Mongo.

### 5. Hashing seguro

- **Passwords**: bcrypt 12 rounds (`~250ms` por hash, lo suficientemente lento para resistir GPU brute force)
- **Tokens de email**: se guarda en DB `sha256(token)`, el raw va solo al mail.
  Si alguien dumpea la DB, los tokens son inservibles.

### 6. Headers HTTP

`helmet` aplica defaults seguros:
- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- y varios más

### 7. CORS estricto

Solo `CLIENT_ORIGIN` puede llamar a la API. Cualquier otro origen recibe error CORS.

### 8. Validación de email en registro

Cuando alguien se registra, la cuenta queda en `emailVerified: false`.
El login devuelve **403 con `code: 'EMAIL_NOT_VERIFIED'`** hasta que confirmen
clickeando el link. Esto previene:
- Cuentas fake masivas con emails inventados
- Spam de password reset a emails reales con cuentas no creadas

### 9. Responses neutras en flows sensibles

`/forgot-password` y `/resend-verification` devuelven **siempre el mismo mensaje**
("Si el email existe, te llegará un link") aunque el email no esté registrado.
Esto previene enumeración de usuarios — un attacker no puede usar nuestro endpoint
como un "¿este email está registrado?" oracle.

## localStorage / sessionStorage audit

| Key | Contenido | Riesgo si lo lee un script malicioso |
|-----|-----------|--------------------------------------|
| `ph-cart` | `{state: {items: [{product, quantity}], isOpen}}` | Ninguno — solo IDs y cantidades públicas |
| `ph-auth` | `{state: {token: JWT}}` | **Token JWT robado** → ver trade-off abajo |
| `mb-theme` | `{state: {theme: 'dark'/'light'}}` | Ninguno |
| `pendingOrderId` (sessionStorage) | `string` (Mongo ObjectId) | Ninguno — solo un ID, el backend valida ownership |
| `isMockPayment` (sessionStorage) | `string` boolean | Ninguno |

## Trade-off conocido: JWT en localStorage

**Riesgo**: si una vulnerabilidad XSS se introduce en el frontend (ej. una
dependencia npm comprometida), un script puede leer `localStorage.ph-auth`
y robar el JWT.

**Por qué lo aceptamos por ahora**:
- React escapa el contenido por default (no `dangerouslySetInnerHTML` con user input)
- No usamos `eval` ni `innerHTML` con datos no controlados
- CSP de `helmet` bloquea scripts inline en producción

**Cómo mejorarlo (refactor futuro)**:
- JWT en **httpOnly cookie** (no accesible desde JS)
- Agregar **CSRF protection** (necesario porque la cookie va en todos los requests)
- Frontend usa `withCredentials: true` en axios

Está documentado como mejora pendiente.

## Variables de entorno requeridas

```env
# Críticas — sin estas el server no arranca
MONGODB_URI=...
JWT_SECRET=...           # 64+ chars aleatorios
SMTP_USER=...
SMTP_PASS=...            # Gmail App Password, NUNCA tu password real

# Producción
MP_ACCESS_TOKEN=...      # Token de PROD de MP (empieza con APP_USR-)
MP_WEBHOOK_SECRET=...    # Para validar firmas de webhook
NODE_ENV=production      # Activa trust proxy, etc.
```

**El `.env` está en `.gitignore`** — nunca se commitea. El `.env.example` queda
en el repo como template.

## Checklist de seguridad pre-producción

- [ ] HTTPS obligatorio (Vercel/Nginx/Cloudflare se encargan automáticamente)
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` regenerado (no usar el del dev)
- [ ] `MP_ACCESS_TOKEN` de producción (no TEST-)
- [ ] `MP_WEBHOOK_SECRET` configurado en MP panel
- [ ] App Password de Gmail rotado (el del dev pasó por chat)
- [ ] MongoDB con auth y red privada (no exponer 27017 al internet)
- [ ] Backup automático de MongoDB
- [ ] Logs centralizados (Datadog / Sentry / etc.) con scrubbing de PII
- [ ] Política de password complexity más estricta si el target es empresarial
- [ ] Considerar 2FA para admins

## Reportar vulnerabilidades

Si encontrás algo: moonbyte.hardware@gmail.com
