# PROMPT BACKEND — Módulo de Envíos (Envia.com → Andreani)

## Contexto del proyecto

Estoy construyendo un ecommerce con el siguiente stack:
- **Runtime**: Node.js + Express
- **Lenguaje**: TypeScript estricto (sin `any`)
- **Base de datos**: MongoDB
- **Arquitectura**: modular (cada feature en su propio módulo)
- **Proveedor logístico**: Envia.com (intermediario multi-carrier), usando **exclusivamente Andreani** como carrier

Ya tengo implementado el módulo de productos y el checkout. Ahora necesito integrar el módulo de envíos.

---

## Objetivo

Crear el módulo `shipping` completo dentro de `src/modules/shipping/` que se integre con la API REST de Envia.com para:

1. **Cotizar envío** antes de confirmar la compra (mostrar precio en checkout), forzando carrier `andreani`
2. **Crear etiqueta/orden de envío** al confirmar el pago
3. **Tracking** del paquete por número de seguimiento

---

## Autenticación Envia.com

La API usa **Bearer Token estático** (no OAuth, no refresh):

- **Sandbox base URL**: `https://api-test.envia.com/`
- **Producción base URL**: `https://api.envia.com/`
- **Header requerido en todos los requests**: `Authorization: Bearer {token}`
- El token se obtiene manualmente desde el dashboard:
  - Sandbox: `shipping-test.envia.com/settings/developers`
  - Producción: `shipping.envia.com/settings/developers`
- Sandbox signup: `accounts-sandbox.envia.com/signup`

Variables de entorno:
```
ENVIA_TOKEN=             # token de sandbox o producción según NODE_ENV
ENVIA_BASE_URL=https://api-test.envia.com   # cambiar a https://api.envia.com en producción
ENVIA_CARRIER=andreani   # hardcodeado: siempre Andreani
```

**No hay flujo OAuth ni refresh de token.** El token es estático; se lee de env en cada request.

---

## Estructura de archivos requerida

```
src/modules/shipping/
├── shipping.types.ts        # Interfaces y tipos TypeScript
├── envia.client.ts          # Cliente HTTP con axios/fetch + manejo de errores
├── shipping.service.ts      # Lógica de negocio
├── shipping.controller.ts   # Handlers de Express
├── shipping.routes.ts       # Definición de rutas
└── shipping.model.ts        # Schema MongoDB para persistir envíos
```

---

## Tipos TypeScript requeridos (`shipping.types.ts`)

```typescript
// Cotización
interface CotizarEnvioInput {
  origen: DireccionEnvio;
  destino: DireccionEnvio;
  paquetes: PaqueteEnvio[];
}

interface DireccionEnvio {
  nombre: string;
  telefono: string;
  calle: string;
  ciudad: string;
  provincia: string;   // nombre completo, ej: "Buenos Aires"
  pais: 'AR';
  codigoPostal: string;
  // opcionales para destino
  email?: string;
  altura?: string;
  piso?: string;
  departamento?: string;
}

interface PaqueteEnvio {
  tipo: 'box' | 'envelope';
  contenido: string;
  cantidad: number;
  valorDeclarado: number;
  unidadLongitud: 'CM';
  unidadPeso: 'KG';
  peso: number;
  dimensiones: {
    largo: number;
    ancho: number;
    alto: number;
  };
}

interface OpcionEnvio {
  carrier: string;          // siempre "andreani"
  service: string;          // código del servicio, ej: "standard"
  serviceDescription: string;
  totalPrice: string;
  currency: string;
  deliveryEstimate: string;
  deliveryDate: {
    date: string;
    timeUnit: string;
    dateDifference: number;
  } | null;
}

interface CotizacionResult {
  opcion: OpcionEnvio;      // solo devolvemos la de Andreani
}

// Crear etiqueta
interface CrearEtiquetaInput {
  orderId: string;          // referencia interna del ecommerce
  origen: DireccionEnvio;
  destino: DireccionEnvio;
  paquetes: PaqueteEnvio[];
  service: string;          // viene de la cotización
}

interface EtiquetaCreada {
  shipmentId: number;
  trackingNumber: string;
  labelUrl: string;         // URL del PDF de la etiqueta
  carrier: string;
  totalPrice: number;
  currency: string;
}

// Tracking
interface TrackingEvento {
  timestamp: string;
  location: string | null;
  description: string;
}

interface TrackingResult {
  trackingNumber: string;
  status: string;
  carrier: string;
  eventos: TrackingEvento[];
}

// Estado normalizado para MongoDB
type EstadoEnvio = 'pending' | 'in_transit' | 'delivered' | 'failed';
```

---

## Endpoints a exponer

### `POST /api/shipping/cotizar`

Llama a `POST /ship/rate/` de Envia.com con `carrier: "andreani"` hardcodeado.
Devuelve solo la opción de Andreani. Si Envia.com devuelve resultados de otros carriers (no debería, pero por seguridad), filtrar y conservar solo los de `carrier === "andreani"`.

**Body:**
```json
{
  "cpOrigen": "1642",
  "cpDestino": "5000",
  "pesoKg": 0.5,
  "largo": 30,
  "ancho": 20,
  "alto": 10,
  "valorDeclarado": 5000,
  "contenido": "Ropa"
}
```

**El backend construye internamente el body de Envia.com:**
```json
{
  "origin": {
    "name": "Tienda",
    "phone": "...",
    "street": "...",
    "city": "...",
    "state": "...",
    "country": "AR",
    "postalCode": "1642"
  },
  "destination": {
    "name": "Destino",
    "phone": "0000000000",
    "street": ".",
    "city": ".",
    "state": ".",
    "country": "AR",
    "postalCode": "5000"
  },
  "packages": [{
    "type": "box",
    "content": "Ropa",
    "amount": 1,
    "declaredValue": 5000,
    "lengthUnit": "CM",
    "weightUnit": "KG",
    "weight": 0.5,
    "dimensions": { "length": 30, "width": 20, "height": 10 }
  }],
  "shipment": {
    "type": 1,
    "carrier": "andreani"
  }
}
```

**Response `200`:**
```json
{
  "carrier": "andreani",
  "service": "standard",
  "serviceDescription": "Andreani Estándar",
  "totalPrice": "1850.00",
  "currency": "ARS",
  "deliveryEstimate": "3-5 días hábiles"
}
```

---

### `POST /api/shipping/etiqueta`

Llama a `POST /ship/generate/` de Envia.com. Persiste el resultado en MongoDB.

**Body:**
```json
{
  "orderId": "order_abc123",
  "cpOrigen": "1642",
  "cpDestino": "5000",
  "destinatario": {
    "nombre": "Juan Pérez",
    "telefono": "1123456789",
    "email": "juan@example.com",
    "calle": "Corrientes",
    "altura": "1234",
    "ciudad": "Córdoba",
    "provincia": "Córdoba",
    "codigoPostal": "5000"
  },
  "paquetes": [{
    "contenido": "Ropa",
    "pesoKg": 0.5,
    "largo": 30,
    "ancho": 20,
    "alto": 10,
    "valorDeclarado": 5000
  }],
  "service": "standard"
}
```

**Response `201`:**
```json
{
  "shipmentId": 166819,
  "trackingNumber": "12345678901234",
  "labelUrl": "https://s3.amazonaws.com/.../etiqueta.pdf",
  "carrier": "andreani",
  "totalPrice": 1850,
  "currency": "ARS"
}
```

---

### `POST /api/shipping/tracking`

Llama a `POST /ship/generaltrack/` de Envia.com.

**Body:**
```json
{ "trackingNumber": "12345678901234" }
```

**Response `200`:** `TrackingResult`

---

## Schema MongoDB (`shipping.model.ts`)

Campos del documento:
- `orderId` — referencia al pedido del ecommerce
- `shipmentId` — ID de Envia.com
- `trackingNumber`
- `carrier` — siempre `"andreani"`
- `service` — código del servicio
- `labelUrl` — URL del PDF
- `estado` — `EstadoEnvio` (pending | in_transit | delivered | failed)
- `totalPrice` / `currency`
- `creadoEn` / `actualizadoEn` (timestamps automáticos de Mongoose)

---

## Cliente HTTP (`envia.client.ts`)

- Usar `axios` o `node-fetch` (lo que ya use el proyecto)
- Header `Authorization: Bearer ${process.env.ENVIA_TOKEN}` en todos los requests
- Header `Content-Type: application/json`
- **Retry automático**: máx 3 intentos con backoff exponencial en errores 5xx
- En errores 4xx: lanzar `EnviaApiError` con el mensaje del body de Envia.com
- Loggear cada llamada: timestamp, método, endpoint, status code

---

## Reglas de implementación

- **Sin `any`** en ningún archivo TypeScript
- El carrier `"andreani"` debe leerse de `process.env.ENVIA_CARRIER` (valor por defecto `"andreani"`)
- Validar inputs con **zod**
- Separar cliente HTTP (`envia.client.ts`) de lógica de negocio (`shipping.service.ts`)
- Clases de error tipadas: `ShippingError`, `EnviaApiError`
- Exportar el router desde `shipping.routes.ts` para montarlo en `app.ts`

---

## Integración en `app.ts`

```typescript
import shippingRoutes from './modules/shipping/shipping.routes';
app.use('/api/shipping', shippingRoutes);
```

---

## Referencia oficial

- Docs: https://docs.envia.com/
- Quickstart: https://docs.envia.com/docs/quickstart
- Auth: https://docs.envia.com/docs/authentication
- Cotizar: `POST /ship/rate/`
- Generar etiqueta: `POST /ship/generate/`
- Tracking: `POST /ship/generaltrack/`
