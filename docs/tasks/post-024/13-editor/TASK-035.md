# TASK-035: Guías de alineación (chrome)

## Estado documental

Lista

## Objetivo

Mostrar guías visuales de alineación mientras se arrastra un elemento,
sin persistirlas, sin historial extra y sin incluirlas en el PNG/JPG.

## Prioridad

P0

## Dependencias

TASK-033

## Contexto obligatorio

- @docs/product/post-mvp-spec.md
- @docs/product/mvp-spec.md
- @docs/product/brand-system.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/rendering-and-export.md
- @docs/decisions/ADR-003-state-management.md
- @.cursor/rules/testing.mdc

## Estado inicial

FR-09 ya pinta un grid de 16 px. El drag usa transacción
(`beginTransaction` / `commitMove` / `commitTransaction`). El raster
excluye chrome por clase y `data-testid`. Wave 1 congelada: este archivo
es W13-02 / FR-P02. Schema `1`. Sin ADR nuevo.

## Dentro del alcance

- Guías **solo visuales** durante el drag de puntero (`onNodeDrag` /
  selection drag). Al soltar, desaparecen.
- Sin snap magnético: la geometría sigue siendo la del gesto actual.
- Función pura testeable (p. ej. `src/editor/interactions/alignmentGuides.ts`)
  que, dados los rectángulos arrastrados y el resto, devuelve las
  coordenadas X/Y de guía.
- Alinear bordes izquierdo/derecho/superior/inferior y centros, de cada
  nodo del gesto contra elementos que **no** están en el gesto (Actor,
  UseCase, SystemBoundary).
- Umbral: **4 px** en coordenadas de documento (un cuarto del grid FR-09).
- Overlay en coordenadas de flujo; trazo 1 px `var(--color-brand)`;
  `aria-hidden="true"`; `data-testid="alignment-guides"`.
- Excluir ese `data-testid` (y la clase del overlay si existe) del
  filtro de `exportDiagram`.
- Estado local de UI, no el documento, no el historial, no localStorage.

## Fuera del alcance

- Snap-to-guide o snap-to-grid extra (el grid 16 px no cambia).
- Guías en resize del boundary, nudge de flechas o idle.
- Persistir waypoints, posiciones de guía o tipos de React Flow.
- Minimap (W13-03), auto-layout, tokens de color nuevos.
- Reabrir ADR-003 o ADR-006. Pin `html-to-image@1.11.11` intacto.
- TASK-034 ni el resto del catálogo.

## Archivos / módulos afectados

- `src/editor/interactions/alignmentGuides.ts` (nuevo, puro)
- `src/editor/interactions/alignmentGuides.test.ts`
- `src/editor/canvas/DiagramCanvas.tsx` (overlay; no mapper de dominio)
- `src/editor/interactions/useNodeDrag.ts` y/o `nodeDrag.ts` si hace falta
  exponer geometría en vivo
- `src/export/exportDiagram.ts`
- `src/export/exportDiagram.test.ts`
- `src/editor/canvas/DiagramCanvas.test.tsx` y/o E2E de drag
- `docs/tasks/post-024/13-editor/TASK-035.md`
- `docs/tasks/post-024/README.md` (estado/evidencia)

## Cambios esperados

Al arrastrar un actor o caso hasta alinear un borde o el centro con otro
elemento (±4 px), aparece una línea de guía. Soltar quita la guía. Undo
sigue siendo un gesto. El PNG/JPG no muestra las líneas.

## Restricciones

- No escribir el documento ni la pila de historial por pintar guías.
- No persistir internals de `@xyflow/react`.
- No añadir variables CSS: usar `--color-brand`.
- `src/domain` no cambia. Schema `1` intacto.
- Sin paquetes nuevos.

## Criterios de aceptación

- [ ] Drag que alinea un borde o el centro (dentro de 4 px) muestra al
      menos una guía; al `dragend` no queda ninguna.
- [ ] Mover 8 px fuera del umbral no muestra guía en esa coordenada.
- [ ] El overlay es `aria-hidden` y `data-testid="alignment-guides"`.
- [ ] `excludeExportChrome` ignora ese nodo; test de export cubre el id.
- [ ] Un gesto de drag sigue siendo **una** entrada de historial.
- [ ] Round-trip de workspace: ninguna clave nueva; `schemaVersion` `1`.
- [ ] Resize de boundary y nudge de flechas no activan guías.

## Tests

Unidad de la función pura: coincidencia de borde/centro, umbral 4 vs 5,
multi-selección vs no arrastrados, lista vacía. Export: el testid entra
en la exclusión. Canvas o E2E: guía presente durante drag y ausente
después (sin `waitForTimeout`).

## Comandos de verificación

```bash
npm run test -- src/editor/interactions/alignmentGuides.test.ts src/export/exportDiagram.test.ts
npm run check
```

Si hay E2E de drag/guías, ejecutarlo además. `npm run check` al cierre.

## Stop conditions

- Se pide snap magnético o persistir las guías.
- Se pide un color o token fuera de `brand-system.md`.
- El raster incluye las guías y se sugiere cambiar el pin de
  `html-to-image` en vez de excluir chrome.

## Definition of Done

FR-P02 observable en el editor; schema `1` e historial intactos; criterios
`[x]` con evidencia.

## Evidencia de cierre

Pendiente.
