# TASK-039: Minimap de navegación (chrome)

## Estado documental

Hecha

## Objetivo

Mostrar un minimapa del documento para pan/zoom de navegación, como chrome
del editor: no persistido, no en el historial y no en el PNG/JPG.

## Prioridad

P1

## Dependencias

TASK-037

## Contexto obligatorio

- @docs/product/post-mvp-spec.md
- @docs/product/mvp-spec.md
- @docs/product/brand-system.md
- @docs/architecture/rendering-and-export.md
- @docs/decisions/ADR-002-diagram-engine.md
- @docs/decisions/ADR-003-state-management.md
- @docs/architecture/schema-evolution.md
- @.cursor/rules/testing.mdc

## Estado inicial

Wave 2 congelada: este archivo es W13-03 / FR-P04. El lienzo usa React Flow
12; los controles de zoom/fit son propios (`CanvasViewportControls`) abajo
a la izquierda. `excludeExportChrome` ya lista la clase
`react-flow__minimap`. Schema `1`. Sin MiniMap montado.

## Dentro del alcance

- Usar `<MiniMap>` de `@xyflow/react` (ya en ADR-002). No un segundo motor
  ni un paquete nuevo.
- Navegación: pan y zoom del **viewport** al interactuar con el mapa. No
  muta `DiagramDocument`. No escribe historial.
- Posición: esquina **inferior derecha** (los controles de zoom están a la
  izquierda). No solaparse con atribución de React Flow: dejar el hueco
  que ya reserva el canvas.
- Visible a `min-width: 1024px` (chrome completo). Oculto bajo 1024 px
  (drawers / aviso de viewport). Sin control de mostrar/ocultar extra.
- Tokens existentes: fondo `var(--color-surface)`, borde
  `var(--color-control-border)`, máscara `var(--color-bg)`, nodos con
  `var(--color-fg)` / `var(--color-brand)` según tipo. Sin variables CSS
  nuevas.
- `aria-label="Mapa del diagrama"`; `data-testid="diagram-minimap"`.
- Confirmar que `excludeExportChrome` ignora `.react-flow__minimap` (ya
  está el fragmento; cubrir el testid si se añade clase propia).

## Fuera del alcance

- Persistencia del minimap, su tamaño o su posición.
- Auto-layout, waypoints, temas.
- Selector de tipo de diagrama (W17-01).
- Reabrir ADR-002 o ADR-003.
- Cambiar el pin de React Flow. Paquetes nuevos.

## Archivos / módulos afectados

- `src/editor/canvas/DiagramCanvas.tsx` y `DiagramCanvas.module.css`
- `src/editor/canvas/DiagramCanvas.test.tsx` y/o E2E
- `src/export/exportDiagram.ts` / `exportDiagram.test.ts` (testid si aplica)
- `docs/tasks/post-024/13-editor/TASK-039.md`
- `docs/tasks/post-024/README.md` (estado/evidencia)

## Cambios esperados

En viewport `>=1024×720`, aparece un mapa en la esquina inferior derecha.
Arrastrar el recuadro mueve la vista; el JSON persistido no cambia. El
PNG/JPG no incluye el mapa.

## Restricciones

- No escribir el documento ni la pila de historial.
- No persistir internals de `@xyflow/react`.
- `src/domain` no cambia. Schema `1` intacto.

## Criterios de aceptación

- [x] El minimap está en el DOM a `>=1024` px (`data-testid="diagram-minimap"`)
      y no está bajo 1024 px.
- [x] Interactuar con el mapa cambia viewport, no el documento ni el
      historial.
- [x] `excludeExportChrome` ignora el minimap; el test de export cubre
      clase y/o testid.
- [x] Round-trip de workspace: ninguna clave nueva; `schemaVersion` `1`.
- [x] Sin tokens CSS nuevos; sin paquete nuevo.

## Tests

Canvas o E2E: presente a 1024×720, ausente a 800×720. Export: exclusión.
Unidad de `excludeExportChrome` si se añade testid. Sin
`waitForTimeout`.
Realizar las pruebas con el MCP de google dev tools for agents en cursor IDE

## Comandos de verificación

```bash
npm run test -- src/editor/canvas/DiagramCanvas.test.tsx src/export/exportDiagram.test.ts
npm run check
```

Si hay E2E de minimap, ejecutarlo además. `npm run check` al cierre.

## Stop conditions

- Se pide persistir el mapa o un segundo motor gráfico.
- Se pide un color fuera de `brand-system.md`.
- El raster incluye el minimap y se sugiere cambiar `html-to-image`.

## Definition of Done

FR-P04 observable en el editor; schema `1` e historial intactos; criterios
`[x]` con evidencia.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. FR-P04 observable: MiniMap de `@xyflow/react`
en la esquina inferior derecha a `>=1024` px (`data-testid="diagram-minimap"`,
`aria-label="Mapa del diagrama"`). Ausente bajo 1024 px (drawers). Pan/zoom
del viewport al arrastrar; no muta `DiagramDocument` ni el historial.
`excludeExportChrome` cubre `.react-flow__minimap` y `diagram-minimap`.
Schema `1` / `storageVersion` `1` intactos. Sin tokens CSS nuevos. Sin
paquete nuevo. `src/domain` no cambia.

Comandos realmente corridos:

```bash
npm run test -- src/editor/canvas/DiagramCanvas.test.tsx src/export/exportDiagram.test.ts
npx playwright test e2e/minimap.spec.ts --project=chromium
npx playwright test e2e/shell-layout.spec.ts e2e/visual.spec.ts e2e/minimap.spec.ts --project=chromium
npm run lint
npm run typecheck
npm run test
npm run build
```

Unidad: 11/11 en los dos archivos de la TASK; suite 303/303. E2E Chromium:
`minimap.spec.ts` 2/2; shell-layout + visual + minimap 9/9. Lint, typecheck
y `vite build` OK.

Chrome DevTools MCP: a 1024×720 el mapa está visible y no solapa la
atribución; arrastrarlo cambia el transform del viewport y Deshacer sigue
indisponible; a 800×720 `minimapCount` es 0.

`npm run check` falla en `format:check` por los mismos archivos de
chrome/tooltips de TASK-024 (028–038). Esta TASK no los reformateó. Los
archivos tocados pasan Prettier.

Baselines de shell (1024/1440/1920) actualizados por el minimap. Baseline
del diagrama de referencia regenerado: el UML no cambia; el recorte
enmascara el minimap como el resto del chrome.
