# TASK-042: Selección y retarget de relaciones

## Estado documental

Hecha

## Objetivo

Un click en la línea de Association, Include o Extend selecciona la
relación para eliminar o cambiar origen/destino, aunque cruce el
boundary.

## Prioridad

P0

## Dependencias

TASK-014, TASK-041

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/domain-model.md
- @docs/architecture/rendering-and-export.md
- @docs/architecture/schema-evolution.md
- @docs/tasks/TASK-013.md
- @docs/tasks/TASK-014.md
- @.cursor/rules/testing.mdc
- @.cursor/rules/domain.mdc

## Estado inicial

FR-05/06 y TASK-013 ya exigen seleccionar y borrar la relación. El
inspector muestra extremos de solo lectura; ConnectForm solo crea.
`edgesReconnectable` es `false`. El `SystemBoundary` rellena su
rectángulo y captura el click: Include/Extend entre casos internos
quedan tapados. El estereotipo tiene `pointer-events: none`. Schema
`1`. Hallazgo de producto 2026-09-14 (no es entrada de catálogo
Post-MVP; es defecto 1.x).

## Dentro del alcance

- Click en el trazo, hit area o estereotipo «include»/«extend»
  selecciona esa relación (inspector, Delete).
- El interior del boundary **no** captura el click: pasa a la
  relación o al pane. Título, borde/resizer y handles siguen
  operables. Actores y casos siguen encima de las líneas (R-08).
- Cambiar origen/destino de la relación **seleccionada**:
  desplegables en el inspector (alternativa por teclado ya
  autorizada) y reconnect de xyflow al arrastrar un extremo.
  Misma matriz `canConnect`; la asociación sigue normalizando actor
  como `sourceId`. Una mutación = una entrada de historial. Mismo
  `id` de relación.
- Intento inválido no muta y anuncia la razón de dominio.
- Chrome de reconnect no entra en el PNG/JPG.
- Schema `1` intacto.

## Fuera del alcance

- Waypoints, routing persistido, Generalization.
- Snap, auto-layout, minimap, export nuevo.
- Reabrir ADR. Paquetes nuevos. Bump de schema.
- Cambiar la matriz de conexión del MVP.

## Archivos / módulos afectados

- `src/domain/diagram/operations.ts` (`reconnectRelationship`)
- `src/domain/diagram/operations.test.ts`
- `docs/architecture/domain-model.md` (tabla de operaciones)
- `src/editor/store/actions.ts`
- `src/editor/store/editorStore.test.ts`
- `src/editor/tools/relationshipTool.ts`
- `src/editor/tools/relationshipTool.test.ts`
- `src/editor/canvas/DiagramCanvas.tsx`
- `src/editor/canvas/DiagramCanvas.module.css`
- `src/editor/nodes/SystemBoundaryNode.module.css`
- `src/editor/edges/DependencyEdge.tsx`
- `src/editor/edges/DependencyEdge.test.tsx`
- `src/editor/components/Inspector/Inspector.tsx`
- `src/editor/components/Inspector/Inspector.test.tsx`
- `src/editor/store/selectors.ts`
- `src/export/exportDiagram.ts`
- `src/export/exportDiagram.test.ts`
- `e2e/association.spec.ts` y/o `e2e/include-extend.spec.ts`
- `docs/architecture/rendering-and-export.md` (click vs boundary)
- `docs/tasks/post-024/13-editor/TASK-042.md`
- `docs/tasks/post-024/README.md` (estado/evidencia)

## Cambios esperados

Con dos casos dentro del sistema y un Include entre ellos, click en
la línea o en «include» selecciona la relación. El inspector permite
cambiar destino. Delete borra solo la relación. Undo restaura.

## Restricciones

- `src/domain` sin React/DOM/xyflow.
- No persistir internals de `@xyflow/react`.
- Pin `html-to-image@1.11.11` intacto.
- Sin `any` injustificado.

## Criterios de aceptación

- [x] Click en Association, Include y Extend (trazo o estereotipo)
      selecciona esa relación; el inspector muestra tipo y extremos.
- [x] Include/Extend cuyos extremos están **dentro** del boundary se
      pueden seleccionar (el relleno del sistema no se come el click).
- [x] Con la relación seleccionada, Delete la elimina; los extremos
      permanecen; undo restaura la misma relación.
- [x] Inspector: cambiar origen o destino válido actualiza la relación
      (mismo `id`); intento inválido no muta y muestra la razón.
- [x] Arrastrar un extremo de la relación seleccionada a un nodo válido
      reconecta; uno inválido no muta.
- [x] Round-trip workspace: ninguna clave nueva; `schemaVersion` `1`.
- [x] El updater de reconnect no aparece en el raster.

## Tests

Unidad: `reconnectRelationship` (válido, no-op, swap de association,
duplicado, desconocido). Inspector: desplegables y error. Edge:
estereotipo clickable. Export: clase `react-flow__edgeupdater`.
E2E: Include interno al boundary → click línea/estereotipo → inspector
→ borrar; Association cambia destino desde inspector.

## Comandos de verificación

```bash
npm run test -- src/domain/diagram/operations.test.ts src/editor/tools/relationshipTool.test.ts src/editor/components/Inspector/Inspector.test.tsx src/editor/edges/DependencyEdge.test.tsx src/export/exportDiagram.test.ts
npx playwright test e2e/association.spec.ts e2e/include-extend.spec.ts --project=chromium
npm run check
```

## Stop conditions

- Se pide persistir waypoints o cambiar `kind` de la relación.
- Se pide que el interior del boundary siga capturando click **y**
  deje pasar el de la línea (imposible sin hit-test mixto nuevo).
- Se pide un paquete o bump de schema.

## Definition of Done

Click selecciona Association/Include/Extend; retarget e inspector
funcionan; schema `1`; criterios `[x]` con evidencia.

## Evidencia de cierre

2026-09-14. Criterios `[x]`. Defecto 1.x: el relleno del SystemBoundary
ya no captura el click; Include/Extend internos se seleccionan.
Inspector con desplegables de origen/destino; `reconnectRelationship`
conserva el `id` y la matriz `canConnect`. Updaters de xyflow
(`edgesReconnectable`) llaman la misma operación. Chrome
`react-flow__edgeupdater` excluido del raster. Schema `1` intacto.
El boundary se arrastra desde el título (el interior es pasante).

Comandos realmente corridos:

```bash
npx vitest run src/domain/diagram/operations.test.ts src/editor/tools/relationshipTool.test.ts src/editor/components/Inspector/Inspector.test.tsx src/editor/edges/DependencyEdge.test.tsx src/export/exportDiagram.test.ts src/editor/store/editorStore.test.ts src/editor/canvas/DiagramCanvas.test.tsx
npx playwright test e2e/association.spec.ts e2e/include-extend.spec.ts e2e/reparent-resize.spec.ts --project=chromium
npx eslint src/domain/diagram/operations.ts src/editor/store/actions.ts src/editor/canvas/DiagramCanvas.tsx src/editor/components/Inspector/Inspector.tsx src/editor/tools/relationshipTool.ts src/export/exportDiagram.ts
npx prettier --write <archivos de la TASK>
```

Unidad: 83/83 en los siete archivos. E2E Chromium: 10/10 (incluye
«click en include interno selecciona, cambia destino y borra»).
Lint de los módulos tocados: OK. `npx tsc -b --noEmit` sigue
fallando por `e2e/document-file.spec.ts` (variable `canvas` no
usada; sucio previo a esta TASK, no tocado).
