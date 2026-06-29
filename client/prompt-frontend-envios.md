# PROMPT FRONTEND — Módulo de Envíos (Checkout + Tracking)

## Contexto del proyecto

Ecommerce construido con:
- **Framework**: React + TypeScript (sin `any`)
- **Estilos**: Tailwind CSS, **mobile first**
- **Componentes**: pequeños y con responsabilidad única (máx ~80 líneas)
- **Arquitectura**: modular por feature
- **API propia**: Express en `http://localhost:3001/api`
- **Carrier**: siempre Andreani (el backend ya lo maneja; el frontend solo muestra "Andreani")

Ya existe el flujo de productos y checkout hasta el paso de pago. Ahora necesito integrar el módulo de envíos.

---

## Objetivo

Crear el módulo `shipping` dentro de `src/modules/shipping/` con todos los componentes y lógica para:

1. **Cotizador de envío** en el checkout (el usuario ingresa su CP y ve el costo antes de pagar)
2. **Confirmación del método** (el usuario confirma la opción de Andreani)
3. **Página de tracking** (el usuario rastrea su pedido por número de seguimiento)

---

## Estructura de archivos requerida

```
src/modules/shipping/
├── types/
│   └── shipping.types.ts
├── services/
│   └── shipping.service.ts
├── hooks/
│   ├── useCotizarEnvio.ts
│   └── useTracking.ts
├── components/
│   ├── ShippingCalculator/
│   │   ├── ShippingCalculator.tsx
│   │   └── ShippingResult.tsx
│   ├── ShippingSelector/
│   │   └── ShippingSelector.tsx
│   └── TrackingPage/
│       ├── TrackingPage.tsx
│       ├── TrackingInput.tsx
│       └── TrackingTimeline.tsx
└── index.ts
```

---

## Tipos TypeScript (`shipping.types.ts`)

```typescript
export interface OpcionEnvio {
  carrier: 'andreani';
  service: string;
  serviceDescription: string;
  totalPrice: string;
  currency: string;
  deliveryEstimate: string;
}

export interface CotizacionRequest {
  cpOrigen: string;
  cpDestino: string;
  pesoKg: number;
  largo: number;
  ancho: number;
  alto: number;
  valorDeclarado: number;
  contenido: string;
}

export interface TrackingEvento {
  timestamp: string;
  location: string | null;
  description: string;
}

export interface TrackingResult {
  trackingNumber: string;
  status: string;
  carrier: string;
  eventos: TrackingEvento[];
}

export type EstadoEnvio = 'pending' | 'in_transit' | 'delivered' | 'failed';
```

---

## Componente 1: `ShippingCalculator`

**Propósito:** El usuario ingresa su CP de destino y ve el costo de envío con Andreani.

**Props:**
```typescript
interface ShippingCalculatorProps {
  cpOrigen: string;
  pesoKg: number;
  valorDeclarado: number;
  dimensiones: { largo: number; ancho: number; alto: number };
  contenido?: string;
  onOpcionConfirmada: (opcion: OpcionEnvio, cpDestino: string) => void;
}
```

**Comportamiento:**
- Input de CP destino: solo números, 4 dígitos (Argentina)
- Botón "Calcular envío"
- Mientras carga: skeleton de una card (no spinner genérico)
- Con resultado: muestra `ShippingResult` con los datos de Andreani
- Error: mensaje inline con botón "Reintentar"
- Botón "Confirmar envío" habilitado solo cuando hay resultado

---

## Componente 2: `ShippingResult`

**Propósito:** Card con los datos de la cotización de Andreani.

**Props:**
```typescript
interface ShippingResultProps {
  opcion: OpcionEnvio;
  onConfirmar: () => void;
}
```

**UI:**
- Logo/ícono de Andreani (color violeta `#6B21A8` o similar)
- Precio en ARS formateado: `$ 1.850`
- Tiempo estimado: `3-5 días hábiles` (texto directo del campo `deliveryEstimate`)
- Descripción del servicio
- Botón "Confirmar" con estilo primario
- Mobile first: card full-width en mobile

---

## Componente 3: `ShippingSelector`

**Propósito:** Paso del checkout que integra el calculador. Es el punto de entrada dentro del flujo de compra.

**Props:**
```typescript
interface ShippingSelectorProps {
  cpOrigen: string;
  pesoKg: number;
  valorDeclarado: number;
  dimensiones: { largo: number; ancho: number; alto: number };
  onContinuar: (opcion: OpcionEnvio, cpDestino: string) => void;
}
```

**Comportamiento:**
- Muestra `ShippingCalculator`
- Al confirmar, muestra resumen compacto: "Andreani · $1.850 · 3-5 días"
- Botón "Continuar al pago" deshabilitado hasta confirmar envío

---

## Componente 4: `TrackingPage`

**Propósito:** Página standalone para rastrear un pedido.

**Ruta sugerida**: `/seguimiento`

**Comportamiento:**
- `TrackingInput`: campo de número de seguimiento + botón "Rastrear"
- Lee el número de la query param `?n=XXXX` para links directos (ej: desde email de confirmación)
- `TrackingTimeline`: lista de eventos en orden cronológico inverso (más reciente arriba)
- Cada evento: fecha en español (dd/mm/yyyy HH:mm), descripción, ubicación si existe
- Badge de estado arriba de la timeline:

| Estado API   | Label UI              | Color Tailwind       |
|--------------|-----------------------|----------------------|
| `In transit` | En camino             | `bg-blue-100 text-blue-800` |
| `Delivered`  | Entregado             | `bg-green-100 text-green-800` |
| `pending`    | En preparación        | `bg-gray-100 text-gray-700` |
| cualquier otro | Novedad en el envío | `bg-yellow-100 text-yellow-800` |

- Loading: skeleton de 3 eventos de timeline
- Error: mensaje claro con opción de reintentar

---

## Hook: `useCotizarEnvio`

```typescript
function useCotizarEnvio(): {
  cotizar: (params: CotizacionRequest) => Promise<void>;
  opcion: OpcionEnvio | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}
```

---

## Hook: `useTracking`

```typescript
function useTracking(initialTracking?: string): {
  buscar: (nro: string) => Promise<void>;
  resultado: TrackingResult | null;
  loading: boolean;
  error: string | null;
}
```

Inicializar con `initialTracking` si se pasa (para leer desde query param).

---

## Service (`shipping.service.ts`)

Llamadas al backend propio. Sin lógica de UI.

```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export const shippingService = {
  cotizar: (params: CotizacionRequest): Promise<OpcionEnvio>,
  tracking: (trackingNumber: string): Promise<TrackingResult>,
};
```

Si el status es >= 400, lanzar error con el mensaje del backend.

---

## Variables de entorno

```
VITE_API_URL=http://localhost:3001/api
VITE_CP_ORIGEN=1642
```

---

## Reglas de implementación

- **Sin `any`** en ningún archivo TypeScript
- **Componentes ≤ 80 líneas**: dividir si superan ese límite
- **Mobile first**: diseñar para 375px, escalar hacia arriba con `sm:`, `md:`
- **Solo Tailwind** para estilos, sin CSS custom salvo casos excepcionales
- Todos los textos de UI en **español argentino** (ej: "Calcular envío", "En camino", "Entregado")
- Precios con `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`
- Fechas con `Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' })`
- Accesibilidad básica: `<label>` en inputs, `aria-label` en botones icónicos
- No usar librerías de UI externas (solo Tailwind)

---

## Barrel export (`index.ts`)

```typescript
export { ShippingCalculator } from './components/ShippingCalculator/ShippingCalculator';
export { ShippingSelector } from './components/ShippingSelector/ShippingSelector';
export { TrackingPage } from './components/TrackingPage/TrackingPage';
export { useCotizarEnvio } from './hooks/useCotizarEnvio';
export { useTracking } from './hooks/useTracking';
export type { OpcionEnvio, TrackingResult, EstadoEnvio, CotizacionRequest } from './types/shipping.types';
```
