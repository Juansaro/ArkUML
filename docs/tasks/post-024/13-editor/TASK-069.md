# TASK-069: Mover Inicial y Final ya seleccionados

## Estado documental

Hecha

## Objetivo

Con el nodo ya seleccionado, arrastrar **Inicial** o **Final** cambia
su posición y la persiste, igual que una Acción.

## Prioridad

P0

## Dependencias

TASK-061

## Contexto obligatorio

- @docs/architecture/activity-model.md
- @docs/architecture/interaction-overview-model.md
- @docs/architecture/diagram-kinds.md
- @docs/decisions/ADR-003-state-management.md
- @.cursor/rules/testing.mdc

## Estado inicial

TASK-061 y TASK-063 están `Hecha`. `initial-node` y `activity-final`
existen en `"activity"` y en `"interaction-overview"` y comparten
[`InitialNode.tsx`](../../../../src/editor/nodes/InitialNode.tsx) y
[`ActivityFinalNode.tsx`](../../../../src/editor/nodes/ActivityFinalNode.tsx).
`activity-model.md` ya autoriza `move` de nodos de control. Hallazgo
de producto 2026-09-28: en actividades, con Inicial o Final
seleccionados, el arrastre no cambia la posición. No es entrada de
catálogo Post-MVP. Schema `3`.

## Dentro del alcance

- Arrastre con el nodo **ya seleccionado** actualiza `geometry.x` /
  `geometry.y` de `initial-node` y de `activity-final`.
- El mismo gesto vale en `"activity"` y en `"interaction-overview"`.
- Deseleccionar y volver a seleccionar no impide un arrastre posterior.
- Acción y el resto de nodos de control siguen moviéndose.
- Un gesto de arrastre = una entrada de historial; undo restaura la
  posición.
- El implementador localiza el bloqueo en el chrome (lienzo / hit-test).
  El contrato no fija la causa.

## Fuera del alcance

- Cambiar el tamaño por defecto o mínimo de Inicial/Final.
- Nuevas notaciones UML o kinds.
- TASK-068, MCP, bumps de schema, ADRs.
- Alterar el movimiento de Acción salvo regresión que esta TASK
  introduzca y deba corregir.

## Archivos / módulos afectados

- `src/editor/nodes/InitialNode.tsx`
- `src/editor/nodes/InitialNode.module.css`
- `src/editor/nodes/ActivityFinalNode.tsx`
- `src/editor/nodes/ActivityFinalNode.module.css`
- `src/editor/canvas/DiagramCanvas.tsx`
- `src/editor/canvas/DiagramCanvas.module.css`
- `src/editor/interactions/useNodeDrag.ts`
- `src/editor/interactions/nodeDrag.ts`
- tests colocalizados de esos módulos, si el arreglo cae ahí
- `e2e/activity.spec.ts`
- `e2e/interaction-overview.spec.ts`
- `docs/tasks/post-024/13-editor/TASK-069.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Seleccionar Inicial (o Final), arrastrarlo y soltar deja el nodo en la
nueva posición. Undo vuelve a la anterior. Acción sigue siendo
arrastrable.

## Restricciones

- `src/domain` sin React, DOM ni `@xyflow/react`.
- Schema `3` / `storageVersion` 2 intactos. Sin paquetes nuevos.
- Sin `any` injustificado. No borrar tests para hacerlos pasar.
- No asumir en el código una causa que el diff no demuestre.

## Criterios de aceptación

- [x] Con `initial-node` ya seleccionado, un arrastre persiste
      `geometry.x` / `geometry.y` distintos.
- [x] Igual para `activity-final`.
- [x] El mismo criterio se cumple en `"activity"` y en
      `"interaction-overview"`.
- [x] Soltar la selección y volver a seleccionar no bloquea el
      arrastre siguiente.
- [x] Una Acción seleccionada sigue moviéndose.
- [x] Undo del gesto restaura la posición anterior de Inicial o Final.

## Tests

Reproducir el hallazgo en el chrome (no fijar la causa en el test).
Cubrir el arrastre ya seleccionado de Inicial y Final en actividades,
y al menos Inicial en interacción general. No hace falta suite nueva
de dominio si `moveElements` ya acepta esos kinds.

## Comandos de verificación

```bash
npm run test -- src/editor/interactions src/editor/canvas/DiagramCanvas.test.tsx
npx playwright test e2e/activity.spec.ts e2e/interaction-overview.spec.ts --project=chromium
npm run typecheck
npm run lint
```

## Stop conditions

- El arreglo exige bump de schema, un ADR o un paquete nuevo.
- Hace falta desactivar el marco de selección para todos los nodos y
  eso rompe el recuadro de selección múltiple.
- El dominio rechaza `moveElements` de `initial-node` o
  `activity-final` (entonces no es solo chrome: parar y preguntar).

## Definition of Done

Inicial y Final se mueven estando seleccionados en ambos kinds;
Acción no regresiona; undo restaura; criterios `[x]` con evidencia;
schema `3` intacto.

## Evidencia de cierre

2026-09-28: con Inicial o Final ya seleccionados, el arrastre cambia
`translate` del nodo en actividades; deseleccionar y volver a
seleccionar no bloquea el gesto siguiente; Deshacer restaura esa
`translate`. El mismo gesto de Inicial (incluido Deshacer y
reselección) pasa en interacción general. Acción, con el mismo
arrastre, y Decisión, desde el centro del rombo, siguen moviéndose.
Schema `3` intacto. Sin commit.

`npm run test -- src/editor/interactions src/editor/canvas/DiagramCanvas.test.tsx`
(7 archivos, 35 tests). `npx playwright test e2e/activity.spec.ts
e2e/interaction-overview.spec.ts --project=chromium` (4 tests).
`npx tsc -p tsconfig.app.json --noEmit` limpio. `npm run typecheck`
(`tsc -b`) sigue fallando por `e2e/include-extend.spec.ts`
(`SVGPathElement` / `DOMPoint`; preexistente, fuera de alcance).
`npm run lint` sigue con 37 errores preexistentes en
`e2e/alignment-guides.spec.ts`, `e2e/include-extend.spec.ts`,
`e2e/minimap.spec.ts` y `e2e/performance.spec.ts`; los archivos de
esta TASK no aportan errores.
