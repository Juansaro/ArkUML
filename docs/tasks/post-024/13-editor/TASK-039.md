# TASK-039: Minimap de navegación (chrome)

## Estado documental

Lista

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

- [ ] El minimap está en el DOM a `>=1024` px (`data-testid="diagram-minimap"`)
      y no está bajo 1024 px.
- [ ] Interactuar con el mapa cambia viewport, no el documento ni el
      historial.
- [ ] `excludeExportChrome` ignora el minimap; el test de export cubre
      clase y/o testid.
- [ ] Round-trip de workspace: ninguna clave nueva; `schemaVersion` `1`.
- [ ] Sin tokens CSS nuevos; sin paquete nuevo.

## Tests

Canvas o E2E: presente a 1024×720, ausente a 800×720. Export: exclusión.
Unidad de `excludeExportChrome` si se añade testid. Sin
`waitForTimeout`.

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

Pendiente.
