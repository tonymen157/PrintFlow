# 🖨️ PrintCalc — App PWA para Copiadora
## Documento de Especificación para Agente de Desarrollo

---

## 1. Visión General del Proyecto

**Nombre del proyecto:** PrintCalc  
**Tipo:** Progressive Web App (PWA) — sin instalación, funciona offline  
**Objetivo:** Calcular automáticamente el precio de impresión de uno o varios documentos, detectando la cobertura de color por página y aplicando tarifas configurables por el operador de la copiadora.  
**Usuario principal:** Operador de copiadora (mostrador). No se requiere conocimiento técnico.  
**Usuarios secundarios:** Administrador del negocio (configura precios).

---

## 2. Contexto del Negocio

La aplicación reemplaza el cálculo manual del costo de impresión. El operador recibe un documento del cliente (físico o digital), lo sube a la app, y en segundos obtiene:

- Número total de páginas
- Clasificación de cada página por cobertura de color
- Precio unitario por página según tarifa configurada
- Total a cobrar, con opción de imprimir o compartir recibo

### Lógica de precios por cobertura de color

| Tipo | Cobertura de color | Precio |
|---|---|---|
| Blanco y negro | 0% (sin color detectado) | Tarifa BN |
| Color bajo | 1% – 25% | Tarifa C1 |
| Color medio | 25% – 50% | Tarifa C2 |
| Color alto | 50% – 100% | Tarifa C3 |

> Los umbrales y precios son completamente configurables desde el panel de administración, sin tocar código.

---

## 3. Requisitos Funcionales

### RF1 — Carga y análisis de documentos

- **RF1.1 Múltiples archivos simultáneos:** El operador puede subir varios archivos a la vez (drag & drop o selector). Cada archivo se procesa de forma independiente y los resultados se consolidan en un solo presupuesto total.
- **RF1.2 Formatos soportados:**
  - Documentos: PDF, Word (`.docx`, `.doc`), Excel (`.xlsx`, `.xls`), PowerPoint (`.pptx`, `.ppt`)
  - Imágenes: JPG, PNG, TIFF, BMP, GIF, WEBP, HEIC
  - Texto plano: `.txt`
- **RF1.3 Detección de número de páginas:** Por cada archivo, el sistema extrae automáticamente la cantidad de páginas o láminas.
- **RF1.4 Análisis de cobertura de color por página:** Cada página se rasteriza y se analiza por muestreo de píxeles para determinar el porcentaje de cobertura de tinta/color. Se clasifica en BN, C1, C2 o C3.
- **RF1.5 Vista previa por página:** Miniatura de cada página con su clasificación visual (etiqueta de color) antes de confirmar.
- **RF1.6 Override manual:** El operador puede cambiar manualmente la clasificación de cualquier página (p. ej., convertir una página de C1 a BN) antes de emitir la cotización.

### RF2 — Motor de cálculo de precios

- **RF2.1 Cálculo por página individual:** Cada página tiene su tipo detectado y su precio unitario. El sistema suma todos.
- **RF2.2 Diferenciación por tamaño de papel:** Precios independientes para Carta/A4, Oficio/Legal y A3/Doble Carta.
- **RF2.3 Impresión a una cara o doble cara (dúplex):** El operador elige la modalidad; el sistema ajusta el precio o aplica descuento según configuración.
- **RF2.4 Número de copias:** Campo numérico para multiplicar el total por la cantidad de copias solicitadas.
- **RF2.5 Desglose detallado:** Vista de cotización con: número de página, tipo detectado, precio unitario, subtotal por página. Total general al pie.
- **RF2.6 Aplicación de IVA o impuesto:** Campo configurable para incluir o excluir impuestos en el total mostrado.
- **RF2.7 Cotización multi-archivo consolidada:** Cuando se suben varios archivos, se muestra el resumen por archivo y el gran total consolidado.

### RF3 — Administración de precios

- **RF3.1 Panel de precios protegido por PIN/contraseña:** Accesible desde la misma app, sin login externo. Solo el administrador lo conoce.
- **RF3.2 Tabla de precios editable:** El administrador puede modificar el precio por página para cada combinación de (tipo de color × tamaño de papel × cara).
- **RF3.3 Configuración de umbrales de color:** Los porcentajes límite entre BN/C1/C2/C3 son ajustables (por defecto: 0%, 25%, 50%).
- **RF3.4 Perfil del negocio:** Nombre, logo y datos de contacto que aparecen en los recibos.

### RF4 — Recibos e historial

- **RF4.1 Generación de recibo:** Recibo imprimible o descargable en PDF con detalle de la cotización, nombre del negocio y fecha.
- **RF4.2 Compartir por WhatsApp:** Botón para enviar el resumen de la cotización como mensaje de WhatsApp al cliente.
- **RF4.3 Historial local de cotizaciones:** Registro de las últimas N cotizaciones guardado en el dispositivo (IndexedDB). No se envía a ningún servidor.
- **RF4.4 Exportación de historial:** Descarga del historial en CSV o PDF para control del negocio.

---

## 4. Requisitos No Funcionales

| Categoría | Requisito |
|---|---|
| **Rendimiento** | Análisis de un documento de 20 páginas en menos de 10 segundos en hardware de gama media. Procesamiento en segundo plano con barra de progreso. |
| **Privacidad** | Los archivos del cliente NO se envían a ningún servidor. Todo el análisis ocurre en el navegador del cliente (client-side). Los archivos se liberan de memoria al cerrar. |
| **Disponibilidad offline** | La app funciona sin internet después de la primera carga (Service Worker con caché completo). Los precios y el historial se almacenan localmente. |
| **Usabilidad** | Flujo de máximo 3 pasos por cotización. Fuentes grandes, contraste alto, apto para uso en mostrador bajo cualquier condición de luz. |
| **Compatibilidad** | Chrome 90+, Edge 90+, Firefox 88+, Safari 15+. Responsive desde 768px. Touch-friendly para tablets. |
| **Seguridad** | El panel de administración protegido por PIN. Sin autenticación de servidor (app standalone). Datos locales en IndexedDB con posibilidad de cifrado. |
| **Mantenibilidad** | Precios actualizables sin modificar código. Arquitectura modular: el motor de análisis, la UI y la lógica de precios son capas independientes. |
| **Instalabilidad** | Cumple criterios de PWA instalable: manifest.json, HTTPS, Service Worker. Aparece en "Agregar a pantalla de inicio" en Android/iOS. |

---

## 5. Flujo Principal de Usuario

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1 — Cargar documentos                                 │
│  Arrastrar o seleccionar uno o varios archivos              │
│  Todos los formatos soportados                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 2 — Análisis automático                               │
│  Por cada archivo:                                          │
│    → Detectar páginas                                       │
│    → Rasterizar cada página                                 │
│    → Medir cobertura de color                               │
│    → Clasificar: BN / C1 / C2 / C3                          │
│  Vista previa con miniaturas y etiquetas                    │
│  Override manual disponible                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 3 — Configurar impresión                              │
│  - Tamaño de papel                                          │
│  - Número de copias                                         │
│  - Una cara / doble cara                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  RESULTADO — Cotización                                     │
│  Desglose por página + por archivo + total general          │
│  Botones: Imprimir recibo | Compartir WhatsApp | Guardar    │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────┐
│                    NAVEGADOR (Client-side)                │
│                                                          │
│  ┌────────────────┐   ┌──────────────────────────────┐  │
│  │   UI Layer     │   │     Analysis Engine          │  │
│  │  (React + UI)  │──▶│  PDF.js / mammoth / XLSX     │  │
│  │                │   │  Canvas API (color sampling) │  │
│  └────────────────┘   └──────────────┬───────────────┘  │
│          │                           │                   │
│  ┌───────▼──────────────────────────▼───────────────┐   │
│  │              State Management (Zustand)           │   │
│  │   Archivos | Análisis | Precios | Cotización      │   │
│  └───────────────────────┬───────────────────────────┘   │
│                          │                               │
│  ┌───────────────────────▼───────────────────────────┐   │
│  │              Persistencia Local                    │   │
│  │   IndexedDB (historial) | localStorage (precios)  │   │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Service Worker (PWA)                  │  │
│  │   Cache-first para assets | Offline support        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
                          │ (Solo para hosting estático)
                          ▼
               ┌─────────────────────┐
               │  CDN / Static Host  │
               │  Vercel / Netlify   │
               └─────────────────────┘
```

> **No existe backend.** Todo el procesamiento ocurre en el navegador. No se necesita base de datos ni servidor de aplicaciones.

---

## 7. Stack Tecnológico

### 7.1 Framework principal

| Tecnología | Versión recomendada | Justificación |
|---|---|---|
| **React** | 18+ | Ecosistema maduro, componentes reutilizables, excelente soporte PWA |
| **TypeScript** | 5+ | Tipado fuerte esencial para la lógica de precios y análisis |
| **Vite** | 5+ | Build rápido, HMR, soporte nativo para PWA con plugin |

### 7.2 PWA y Offline

| Tecnología | Uso |
|---|---|
| **vite-plugin-pwa** | Genera Service Worker, manifest, estrategia de caché automática |
| **Workbox** | Caché avanzado, estrategias offline (incluido en vite-plugin-pwa) |
| **web-app-manifest** | Configuración de ícono, nombre, colores, display standalone |

### 7.3 Análisis de documentos (client-side)

| Formato | Librería | Notas |
|---|---|---|
| **PDF** | `pdf.js` (Mozilla) | Renderiza páginas a canvas para análisis de color |
| **Word .docx** | `mammoth.js` | Convierte a HTML; renderizar con canvas para análisis |
| **Excel .xlsx / .xls** | `SheetJS (xlsx)` | Extrae datos; render a canvas via HTML |
| **PowerPoint .pptx** | `pptxgenjs` (lectura) o conversión a PDF vía backend opcional | .pptx es el formato más complejo; puede requerir workaround |
| **Imágenes** (JPG, PNG, etc.) | Canvas API nativa | Cargar imagen en canvas, muestrear píxeles directamente |
| **HEIC** (iPhone) | `heic2any` | Convierte HEIC a JPEG antes del análisis |

### 7.4 Análisis de color

El análisis se realiza con la **Canvas API nativa del navegador**:

```typescript
// Algoritmo de detección de cobertura de color
function analyzeColorCoverage(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data; // RGBA array

  let coloredPixels = 0;
  const totalPixels = width * height;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // Pixel "con color" si R, G, B difieren significativamente entre sí
    // y no es blanco (fondo de papel)
    const isWhiteBackground = r > 240 && g > 240 && b > 240;
    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    const saturation = maxChannel - minChannel;

    if (!isWhiteBackground && saturation > 30) {
      coloredPixels++;
    }
  }

  return (coloredPixels / totalPixels) * 100; // Porcentaje 0-100
}
```

> **Optimización:** Usar muestreo (cada 4 píxeles) para documentos de alta resolución y procesar en Web Worker para no bloquear la UI.

### 7.5 Web Workers

Toda operación de análisis pesada se ejecuta en un **Web Worker** para evitar congelar la interfaz:

```
main thread  ──────────────▶  Web Worker
   UI activa                  Rasterización de páginas
   Barra de progreso          Muestreo de píxeles
   Override manual            Clasificación de color
```

### 7.6 UI y estilos

| Tecnología | Uso |
|---|---|
| **Tailwind CSS** v3 | Estilos utilitarios, diseño responsive, modo oscuro automático |
| **shadcn/ui** | Componentes accesibles (Dialog, Slider, Badge, Progress, Toast) |
| **Radix UI** | Base accesible de shadcn/ui |
| **Lucide React** | Iconografía consistente y ligera |
| **react-dropzone** | Zona de drag & drop para carga de archivos múltiples |

### 7.7 Generación de PDF (recibos)

| Tecnología | Uso |
|---|---|
| **jsPDF** | Generar PDF del recibo en el navegador sin servidor |
| **html2canvas** | Captura del recibo renderizado en HTML para exportar como imagen en PDF |

### 7.8 Estado global

| Tecnología | Justificación |
|---|---|
| **Zustand** | State management liviano, sin boilerplate, ideal para apps sin backend |

Estructura del store:

```typescript
interface AppStore {
  // Archivos cargados
  files: UploadedFile[];
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;

  // Resultado del análisis
  analysisResults: FileAnalysis[];
  setAnalysis: (id: string, result: PageAnalysis[]) => void;

  // Configuración de impresión
  printConfig: {
    paperSize: 'letter' | 'legal' | 'a3';
    sides: 'single' | 'double';
    copies: number;
  };

  // Precios (persistidos en localStorage)
  pricing: PricingConfig;
  updatePricing: (config: Partial<PricingConfig>) => void;

  // Cotización activa
  quote: QuoteResult | null;
  computeQuote: () => void;
}
```

### 7.9 Persistencia local

| Dato | Almacenamiento | Justificación |
|---|---|---|
| Tabla de precios | `localStorage` | Pequeño, acceso síncrono, persiste entre sesiones |
| Historial de cotizaciones | `IndexedDB` (via **idb**) | Estructura compleja, volumen variable, acceso asíncrono |
| Configuración del negocio | `localStorage` | Datos simples del perfil |
| Archivos del cliente | Solo en memoria (RAM) | No se persisten por privacidad |

### 7.10 Testing

| Herramienta | Uso |
|---|---|
| **Vitest** | Tests unitarios del motor de análisis de color y cálculo de precios |
| **React Testing Library** | Tests de componentes UI |
| **Playwright** | Tests E2E del flujo completo de cotización |
| **MSW (Mock Service Worker)** | Mocks de workers para testing offline |

### 7.11 Hosting y despliegue

| Opción | Recomendación | Costo |
|---|---|---|
| **Vercel** | ✅ Primera opción — deploy automático desde Git, HTTPS gratis, CDN global | Gratis (plan hobby) |
| **Netlify** | Alternativa equivalente | Gratis (plan starter) |
| **GitHub Pages** | Opción mínima, requiere config adicional para PWA | Gratis |

> **HTTPS es obligatorio** para que el Service Worker funcione y la app sea instalable como PWA.

---

## 8. Estructura del Proyecto

```
printcalc/
├── public/
│   ├── icons/                  # Íconos PWA (192x192, 512x512, maskable)
│   ├── manifest.json           # Web App Manifest
│   └── offline.html            # Página fallback offline
│
├── src/
│   ├── analysis/               # Motor de análisis (sin dependencias de React)
│   │   ├── colorAnalyzer.ts    # Lógica de detección de color con Canvas
│   │   ├── pdfParser.ts        # Extracción de páginas desde PDF
│   │   ├── docxParser.ts       # Conversión Word → canvas
│   │   ├── xlsxParser.ts       # Conversión Excel → canvas
│   │   ├── imageParser.ts      # Carga y normalización de imágenes
│   │   └── analysisWorker.ts   # Web Worker: orquesta el análisis pesado
│   │
│   ├── pricing/                # Lógica de negocio de precios
│   │   ├── calculator.ts       # Calcula cotización a partir de análisis + config
│   │   ├── types.ts            # PricingConfig, QuoteResult, PageType, etc.
│   │   └── defaults.ts         # Precios y umbrales por defecto
│   │
│   ├── store/                  # Estado global con Zustand
│   │   ├── appStore.ts
│   │   └── persist.ts          # Middleware de persistencia en localStorage
│   │
│   ├── db/                     # IndexedDB para historial
│   │   └── history.ts          # CRUD del historial de cotizaciones
│   │
│   ├── components/             # Componentes React
│   │   ├── upload/
│   │   │   ├── DropZone.tsx    # Zona drag & drop multi-archivo
│   │   │   └── FileList.tsx    # Lista de archivos cargados con estado
│   │   ├── analysis/
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── PageGrid.tsx    # Grid de miniaturas con clasificación
│   │   │   └── PageCard.tsx    # Miniatura + badge + override manual
│   │   ├── quote/
│   │   │   ├── PrintConfig.tsx # Tamaño papel, copias, caras
│   │   │   ├── QuoteDetail.tsx # Desglose por página
│   │   │   ├── QuoteTotal.tsx  # Total general y acciones
│   │   │   └── Receipt.tsx     # Componente imprimible del recibo
│   │   ├── admin/
│   │   │   ├── AdminPanel.tsx  # Panel de administración (protegido)
│   │   │   ├── PricingTable.tsx
│   │   │   └── BusinessProfile.tsx
│   │   └── shared/
│   │       ├── ColorBadge.tsx  # Badge visual por tipo (BN/C1/C2/C3)
│   │       └── Layout.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx            # Flujo principal (upload → analysis → quote)
│   │   ├── History.tsx         # Historial de cotizaciones
│   │   └── Admin.tsx           # Administración (PIN requerido)
│   │
│   ├── hooks/
│   │   ├── useFileAnalysis.ts  # Hook para orquestar el análisis
│   │   └── useQuote.ts         # Hook para calcular y actualizar cotización
│   │
│   ├── utils/
│   │   ├── fileHelpers.ts      # Detección de tipo MIME, validación
│   │   └── formatters.ts       # Formateo de moneda, porcentajes
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── vite.config.ts              # Config Vite + PWA plugin
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 9. Tipos TypeScript clave

```typescript
// Tipos de cobertura de color
type PageType = 'bw' | 'color-low' | 'color-mid' | 'color-high';

// Resultado del análisis de una página
interface PageAnalysis {
  pageNumber: number;
  colorCoverage: number;        // 0–100 porcentaje
  detectedType: PageType;
  overriddenType?: PageType;    // Si el operador lo cambió manualmente
  thumbnail: string;            // data:image/jpeg;base64,...
}

// Resultado del análisis de un archivo
interface FileAnalysis {
  fileId: string;
  fileName: string;
  totalPages: number;
  pages: PageAnalysis[];
  status: 'pending' | 'analyzing' | 'done' | 'error';
  error?: string;
}

// Configuración de precios
interface PricingConfig {
  thresholds: {
    colorLow: number;           // default: 25
    colorMid: number;           // default: 50
  };
  prices: {
    [paperSize in 'letter' | 'legal' | 'a3']: {
      [pageType in PageType]: {
        single: number;         // precio una cara
        double: number;         // precio doble cara
      };
    };
  };
  taxRate: number;              // default: 0 (sin IVA)
  currency: string;             // default: 'USD'
}

// Línea del desglose de cotización
interface QuoteLine {
  fileId: string;
  fileName: string;
  pageNumber: number;
  pageType: PageType;
  unitPrice: number;
  subtotal: number;
}

// Cotización completa
interface QuoteResult {
  id: string;
  createdAt: Date;
  lines: QuoteLine[];
  copies: number;
  paperSize: string;
  sides: 'single' | 'double';
  subtotal: number;
  tax: number;
  total: number;
}
```

---

## 10. Configuración PWA (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'PrintCalc — Cotizador de Impresión',
        short_name: 'PrintCalc',
        description: 'Calcula el precio de impresión analizando la cobertura de color',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'cdn-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 } }
          }
        ]
      }
    })
  ]
});
```

---

## 11. Consideraciones especiales para el agente

### PowerPoint (.pptx) — formato complejo
No existe una librería 100% client-side madura para renderizar .pptx a canvas con alta fidelidad. Estrategia recomendada:
1. **Opción A (simple):** Pedir al usuario que exporte el .pptx a PDF desde PowerPoint antes de subirlo. Documentarlo claramente en la UI.
2. **Opción B (avanzada):** Usar un microservicio serverless (Vercel Function) con LibreOffice headless para convertir .pptx a PDF server-side, luego analizar el PDF en el cliente. Añade latencia pero mantiene la privacidad si se borra el archivo del servidor inmediatamente.

### Archivos grandes (>50 páginas)
- Limitar la resolución de rasterización a 96–150 DPI para análisis (no se necesita alta resolución para detectar color).
- Mostrar barra de progreso por página.
- Procesar en lotes de 5 páginas con pauses para no saturar el Web Worker.

### HEIC (imágenes de iPhone)
- Detectar el tipo MIME `image/heic` o `image/heif`.
- Convertir con `heic2any` antes de pasar al canvas.

### Detección de color — precisión vs. velocidad
- Muestrear 1 de cada 4 píxeles (25% de muestra) da resultados suficientemente precisos y es 4x más rápido.
- Para documentos con fondos de color (no blanco), ajustar el umbral de detección de "fondo" según el color mayoritario de la imagen.

---

## 12. Dependencias del proyecto (package.json)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "pdfjs-dist": "^4.4.0",
    "mammoth": "^1.8.0",
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    "react-dropzone": "^14.2.3",
    "heic2any": "^0.0.4",
    "idb": "^8.0.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.3.0",
    "vite-plugin-pwa": "^0.20.0",
    "workbox-window": "^7.1.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^1.6.0",
    "@testing-library/react": "^16.0.0",
    "playwright": "^1.45.0"
  }
}
```

---

## 13. Comandos de desarrollo

```bash
# Inicializar proyecto
npm create vite@latest printcalc -- --template react-ts
cd printcalc

# Instalar dependencias
npm install

# Desarrollo local con HMR
npm run dev

# Build de producción (genera Service Worker)
npm run build

# Preview del build (para probar PWA offline)
npm run preview

# Tests unitarios
npm run test

# Tests E2E
npx playwright test
```

---

## 14. Roadmap sugerido

| Fase | Entregable | Prioridad |
|---|---|---|
| **Fase 1** | Carga de PDF + imágenes, detección de color, cálculo básico | Alta |
| **Fase 2** | Soporte Word y Excel, override manual, recibo PDF | Alta |
| **Fase 3** | Panel de administración de precios, perfil del negocio | Alta |
| **Fase 4** | PWA completa (offline, instalable), historial IndexedDB | Media |
| **Fase 5** | Soporte PowerPoint, compartir por WhatsApp, exportar historial | Media |
| **Fase 6** | Modo oscuro, múltiples idiomas (i18n), temas de color | Baja |

---

*Documento generado para uso de agente de desarrollo. Versión 1.0*
