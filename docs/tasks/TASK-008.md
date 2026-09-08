# TASK-008: Canvas React Flow, adapter y spike de exportación

## Objetivo

Integrar navegación gráfica conservando el modelo libre de React Flow, y **validar rasterización cross-browser antes de más UI de export**.

## Prioridad

P0

## Dependencias

TASK-005, TASK-007

## Contexto obligatorio

- @docs/decisions/ADR-002-diagram-engine.md
- @docs/decisions/ADR-006-export.md
- @docs/architecture/rendering-and-export.md
- @docs/architecture/architecture.md

## Estado inicial

Shell + store. Sin xyflow.

## Dentro del alcance

- Instalar `@xyflow/react` 12.x y CSS. Instalar `html-to-image@1.11.11` **exacto**.
- `reactFlowMapper` documento → Node[] / Edge[] (aunque edges vacíos).
- Canvas: zoom, pan, fit, grid 16, viewport ↔ store.
- Left-drag selección (vacío = marquee cuando haya nodos), Space+drag / middle pan, wheel zoom al cursor.
- Atribución visible.
- `data-testid` / ARIA estables en el canvas.
- Spike **sin UI pública**: rasterizar fixture con texto + rectángulo/nodo + marker SVG a PNG en Chromium, Firefox y WebKit (`@export-spike`). Registrar diferencias.

## Fuera del alcance

- Diálogo PNG/JPG de producto, escalas 1x/2x UI (TASK-016).
- Nodos UML custom definitivos (TASK-009 puede sustituir placeholders).
- `toObject()` persistido.
- `hideAttribution`.
- Store interno no público de xyflow.

## Archivos / módulos afectados

- `src/editor/canvas/DiagramCanvas.tsx`
- `src/editor/adapters/reactFlowMapper.ts`
- `src/editor/canvas/nodeTypes.ts`, `edgeTypes.ts` (placeholders OK)
- `src/export/spike.ts` o test E2E que invoque raster
- `e2e/export-spike.spec.ts`
- `package.json`

## Cambios esperados

Pan/zoom/fit no mutan documento ni historial. Mapper determinista.

## Restricciones

Pin html-to-image 1.11.11. No construir ExportDialog.

## Criterios de aceptación

- [ ] Viewport se restaura sin salto (store → canvas).
- [ ] Boundary (si el documento default se pinta) sale antes que hijos en el array de nodos.
- [ ] Spike PNG: archivo con firma PNG y píxeles; texto o marker no desaparece por completo en los tres browsers. Fallo material → stop.
- [ ] Sin warnings React de key/unique nodeTypes mal memoizados.

## Tests

Unit mapper. Integration canvas/store si es viable. E2E pan/zoom/fit + `@export-spike`.

## Comandos de verificación

```bash
npm run test -- src/editor/adapters src/editor/canvas
npm run test:e2e -- --grep @export-spike
npm run check
```

## Stop conditions

- Spike falla en un navegador soportado de forma que el diagrama exportado sea inutilizable. Reabrir ADR-006; no seguir a TASK-009 fingiendo que export funcionará.

## Definition of Done

Adapter único que conoce ambos modelos. Spike documentado (comentario o nota breve en rendering-and-export.md solo si hay desviación).
