# Rendering y exportación

## Decisión de rendering

React Flow 12 (`@xyflow/react`) renderiza **nodos como DOM/React** y **relaciones como SVG**. Zoom, pan, selección, marquee, handles y foco de teclado vienen de la librería.

No se usa Canvas (Konva/Fabric) ni un SVG propio como motor del editor. Detalle en [ADR-002](../decisions/ADR-002-diagram-engine.md).

## Adapter anticorrupción

`src/editor/adapters/reactFlowMapper.ts` es el único módulo que conoce ambos modelos.

Responsabilidades:

- Ordenar el array de nodos: boundary **antes** de sus hijos (requisito de sub-flows).
- Mapear `geometry` a `position` / `width` / `height`. Hijos usan posición relativa.
- Mapear `parentId` de UseCase al `parentId` de React Flow.
- Mapear anchors `top|right|bottom|left` a handles.
- Proyectar selección y tipo de edge (`association` | `include` | `extend`).
- No copiar campos internos (`measured`, `selected` de xyflow) de vuelta al dominio salvo posición/tamaño confirmados por acciones semánticas.

La UI no llama a `toObject()` para guardar.

## Interacción gráfica

- Click izquierdo + drag sobre nodo: mover (transacción).
- Click izquierdo + drag en vacío: marquee.
- Space+drag o botón medio: pan.
- Rueda: zoom al cursor.
- Handles visibles en hover, selección o modo relación.
- Fit view no muta el documento.
- Atribución de React Flow **visible** (MIT no obliga a ocultarla; la política del proyecto es no ocultarla sin decisión comercial). Ver [ADR-002](../decisions/ADR-002-diagram-engine.md).

## Exportación PNG / JPG

Flujo (detalle en [ADR-006](../decisions/ADR-006-export.md)):

1. Calcular bounding box de todos los elementos + padding 32 px (`getNodesBounds` o equivalente sobre geometría de dominio/proyección medida).
2. Aplicar un transform de exportación **sin cambiar** el viewport del usuario.
3. Clonar el viewport gráfico filtrando handles, anillos de selección, grid, controles, atribución, inspector y chrome.
4. Rasterizar con `html-to-image@1.11.11` (`toCanvas`).
5. `canvas.toBlob()`:
   - PNG: alpha, sin fondo.
   - JPG: fondo blanco, `quality: 0.92`.
6. Escalas 1x y 2x (`pixelRatio`).
7. Límites: cada dimensión `<= 4096` px; área `<= 16` megapíxeles. Si se excede, sugerir 1x o reducir escala.
8. Descargar Blob; revocar object URL.

No usar `toDataURL` para el archivo final (memoria). No capturar la pantalla del usuario. No mutar zoom visible.

## Spike temprano

TASK-008 instaló React Flow **y** `html-to-image@1.11.11`, y ejecutó un spike E2E cross-browser que rasterizaba texto + nodo + marker SVG. Si Chromium, Firefox o WebKit fallaban de forma material, se detenía el trabajo y se reabría [ADR-006](../decisions/ADR-006-export.md) **antes** de construir más UI.

Resultado del spike (2026-09-07, Windows): Chromium y Firefox conservan rectángulo, texto y marker SVG de forma estable. WebKit conserva rectángulo y texto; el `marker-end` SVG es intermitente (aparece en algunas corridas y no en otras). El diagrama sigue siendo usable (no se reabrió ADR-006).

TASK-029 (2026-09-09) **acepta esa omisión intermitente como limitación de producto**. No se reabre [ADR-006](../decisions/ADR-006-export.md): el PNG/JPG permanece usable (nodos, texto, association). Un fallo nuevo y material de raster (diagrama ilegible en un browser soportado) sí exigiría reabrir el ADR; no implementar otro motor en esa TASK.

TASK-020 eliminó la página oculta `?export-spike`. El tag `@export-spike` cubre el PNG 1x de producto en Firefox/WebKit.

## Producto (TASK-016)

El diálogo **Exportar** rasteriza el bounding box de todos los elementos + 32 px de padding. El transform se aplica solo al clon de `html-to-image`; el zoom/pan del usuario no cambia.

Límites de canvas: 4096 px por lado y 16 megapíxeles. Si 2x no cabe, la UI sugiere 1x. La descarga usa `canvas.toBlob` y revoca el object URL.

Limitaciones de navegador:

- Safari/WebKit puede omitir de forma intermitente los `marker-end` SVG (flechas de include/extend). Limitación de producto aceptada (TASK-029, 2026-09-09); ADR-006 no reabierto.
- El techo de tamaño es el del canvas del navegador; iOS suele ser más estricto (~4096). El estrés 200/300 a 2x (`4864 × 6496`) supera 4096/16 MP; la UI sugiere 1x (`2432 × 3248`, medido). Detalle en [performance.md](performance.md).
- La calidad del texto depende de fuentes locales (Segoe UI / system-ui), no de Google Fonts remotas.

## Evolución a SVG / PDF

No implementarlos. Cuando existan:

- SVG: serializar la proyección vectorial o un exporter dedicado que lea dominio + geometría, no html-to-image.
- PDF: compositor aparte (p. ej. imprimir SVG o incrustar PNG en un PDF). No acoplar el exportador raster actual a un PDF «screenshot».

La interfaz prevista es `exportDiagram(input, { format, scale })` con `format: "png" | "jpg"` hoy y unión extensible mañana.
