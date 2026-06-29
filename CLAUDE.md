# MoonByte — Project-Hardware

Ecommerce de hardware y PCs armadas para el mercado argentino. Monorepo cliente/servidor con checkout via Mercado Pago Checkout Pro.

---

## Stack

- **Cliente**: React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + Zustand + React Router v6 + axios + lucide-react
- **Servidor**: Node.js + Express 4 + TypeScript (ts-node-dev en dev)
- **Base de datos**: MongoDB + Mongoose 8
- **Mail**: Nodemailer (Gmail SMTP con App Password)
- **Pagos**: MercadoPago Checkout Pro v2 (modo mock si no hay `MP_ACCESS_TOKEN`)
- **Storage**: Cloudinary (imágenes de productos via multer + upload route)
- **Auth**: JWT en httpOnly cookie (`auth-token`) + CSRF Double Submit (`csrf-token`) + 2FA TOTP para admins
- **Envíos**: Envia.com + Andreani (`/api/shipping/`) — cotizar, etiqueta, tracking, cancelación
- **Monitoreo**: Sentry (`@sentry/node`) — activo solo si `SENTRY_DSN` está configurado
- **Tests**: Playwright (E2E en `client/e2e/`)

---

## Estructura

```
project-hardware/
├── client/                  # SPA React
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/       # Componentes del panel admin
│   │   │   ├── auth/        # Login, register, etc.
│   │   │   ├── features/    # Componentes de negocio (carrito, producto, etc.)
│   │   │   ├── layout/      # Header, footer, layouts
│   │   │   └── ui/          # Componentes genéricos reutilizables
│   │   ├── hooks/
│   │   ├── modules/
│   │   │   └── shipping/    # ShippingSelector, cotizar hook, tracking
│   │   ├── pages/
│   │   │   ├── admin/       # Dashboard, productos, órdenes (admin)
│   │   │   └── *.tsx        # Páginas públicas y de usuario
│   │   ├── services/        # Llamadas a la API (axios)
│   │   ├── store/           # Stores Zustand (auth, cart, theme)
│   │   ├── types/
│   │   └── utils/
│   └── e2e/                 # Tests Playwright
└── server/
    └── src/
        ├── controllers/
        ├── middleware/       # Auth (cookie+bearer), CSRF, validaciones, rate limiting
        ├── models/          # User, Product, Order (Mongoose)
        ├── modules/
        │   └── shipping/    # Módulo Envia.com: types, client, service, controller, routes, model
        ├── routes/          # auth, product, order, admin, upload, envios, shipping
        ├── services/
        │   ├── email/       # Nodemailer + templates HTML
        │   ├── payment/     # mercadopago.ts (mock/real)
        │   └── storage/     # cloudinary.ts
        ├── scripts/         # seed, backup, testSmtp, testCloudinary, testMercadoPago
        ├── types/
        └── utils/
```

---

## Reglas de código

- No usar `any` en TypeScript
- Componentes pequeños y modulares; lógica en hooks y services
- Mobile first con Tailwind
- Nunca confiar en el cliente para validar pagos — siempre verificar con la API de MP
- `express-validator` en todos los inputs antes de tocar la DB
- Emails normalizados (`normalizeEmail()`) — previene duplicados con distintas mayúsculas
- Validación con Zod en módulo shipping
- Updates atómicos con `findOneAndUpdate` donde haya riesgo de race condition (confirmOrder, cancelToken)

---

## Estado del proyecto

### ✅ Completado
- Auth completo: login, register, verify email, forgot/reset password
- JWT en httpOnly cookie + CSRF Double Submit Cookie pattern
- 2FA TOTP para admins (Google Authenticator / Authy) — setup, enable, verify, disable, backup codes
- Email verification flow (tokens hasheados con sha256 en DB)
- Panel admin: dashboard, CRUD de productos (con Cloudinary), gestión de órdenes
- Panel usuario: perfil, mis órdenes, detalle de orden con tracking
- Catálogo: listado de productos, página de detalle
- Filtros avanzados: `categories`, `brands` (multi), `inStock`, `featured`, rango de precio, sort default `price-desc`
- Carrito de compras (Zustand, persiste en localStorage)
- Checkout con MercadoPago Checkout Pro (preferencias + verificación server-side)
- Cotización de envío automática en checkout via Envia.com + Andreani
- Módulo shipping completo: cotizar, generar etiqueta, tracking, cancelación con confirmación por email
- Etiqueta Andreani generada automáticamente al confirmar pago (MP + transferencia)
- Seguimiento de envío en "Mis Pedidos" — polling a Envia.com en tiempo real
- Botón cancelar envío en panel admin (con confirmación por email)
- Páginas de resultado del checkout: éxito, fallo, transferencia
- Webhook de MP con validación HMAC-SHA256
- Emails transaccionales: verificación, reset password, confirmación de orden, cambio de estado, cancelación envío
- Seguridad: helmet, CORS, rate limiting, express-validator, CSRF, fix race conditions con operaciones atómicas
- Modo mock de MP para desarrollo sin credenciales reales
- Sentry integrado (activo solo si `SENTRY_DSN` está en `.env`)
- MongoDB: connection pooling, timeouts, reconexión automática, validación de auth en producción
- Script de backup (`npm run backup`) con rotación automática de últimos 7

### 🔄 En progreso
- **MP credenciales reales**: bloqueado por `PA_UNAUTHORIZED_RESULT_FROM_POLICIES`.
  El curl directo a MP también falla — no es bug del código.
  Desarrollo continúa en **modo mock** hasta destrabar la cuenta de MP.

### ❌ Pendiente
- Optimización SEO y performance
- Filtros avanzados en catálogo (frontend)

---

## Servicios externos

| Servicio | Estado | Notas |
|----------|--------|-------|
| Nodemailer (Gmail) | ✅ Integrado | App Password requerido en env |
| Cloudinary | ✅ Integrado | Upload de imágenes de productos |
| MercadoPago Checkout Pro | ⚠️ Código OK / credenciales bloqueadas | Mock automático sin `MP_ACCESS_TOKEN` |
| Envia.com + Andreani | ✅ Integrado | `ENVIA_TOKEN` + `ENVIA_BASE_URL` requeridos. Sin token → error (no hay mock) |
| Sentry | ✅ Integrado | Inactivo si `SENTRY_DSN` no está en `.env` |

---

## Variables de entorno (server)

```env
MONGODB_URI=...              # En prod debe incluir user:pass@host
JWT_SECRET=...               # 64+ chars
SMTP_USER=...
SMTP_PASS=...                # Gmail App Password
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MP_ACCESS_TOKEN=...          # Opcional — si no está, activa modo mock
MP_WEBHOOK_SECRET=...
CLIENT_ORIGIN=...            # CORS whitelist
NODE_ENV=production
SENTRY_DSN=...               # Opcional — si no está, Sentry queda deshabilitado
ENVIA_TOKEN=...              # Token estático de Envia.com
ENVIA_BASE_URL=https://api.envia.com
ENVIA_CARRIER=andreani
ENVIA_SERVICE=ground
ENVIA_ORIGEN_NOMBRE=MoonByte
ENVIA_ORIGEN_TELEFONO=...
ENVIA_ORIGEN_CALLE=...
ENVIA_ORIGEN_CIUDAD=...
ENVIA_ORIGEN_PROVINCIA=...
ENVIA_ORIGEN_CP=...
```

---

## Convenciones

- Componentes en PascalCase; hooks, services y utils en camelCase
- Cada dominio en su propia carpeta dentro de `src/`
- El backend nunca devuelve el campo `password` (Mongoose `select: false`)
- Respuestas neutras en flows sensibles (forgot-password, resend-verification) para evitar enumeración de usuarios
- Provincias argentinas se convierten a código de 1 letra para Envia.com (`toProvinciaCode()` en `envia.client.ts`)

---

## Scripts de utilidad (server)

```
npm run dev               # arranca el server con ts-node-dev
npm run backup            # backup de MongoDB → ./backups/ (retiene últimos 7)
npm run seed              # carga productos de ejemplo
npm run test:smtp         # verifica conexión a Gmail
npm run test:cloudinary   # verifica Cloudinary
npm run test:mp           # valida MP_ACCESS_TOKEN y crea test users
```

---

## Última actualización

2026-06-23 — Sesión completa de backend. Agregados: módulo Envia.com/Andreani (cotizar,
etiqueta, tracking, cancelación), JWT → httpOnly cookie + CSRF, 2FA TOTP para admins,
Sentry, filtros avanzados en catálogo, MongoDB production config + backup script,
10 bugs corregidos (security bypass externalReference, race conditions, password vacía,
requireAdmin sin auth, shipmentId=0, orderId tipo incorrecto, SMTP_FROM malformado, etc.).
