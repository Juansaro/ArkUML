# TASK-071: Imantar el arrastre a ejes y a la grilla

## Estado documental

Hecha

## Objetivo

Con el ajuste activo, arrastrar un elemento lo encaja en los ejes de
los demás elementos o, si no hay eje cerca, en la grilla de 16 px.

## Prioridad

P1

## Dependencias

TASK-035

## Contexto obligatorio

- @docs/tasks/post-024/13-editor/TASK-035.md
- @docs/product/mvp-spec.md
- @docs/architecture/rendering-and-export.md
- @docs/decisions/ADR-003-state-management.md
- @.cursor/rules/testing.mdc

## Estado inicial

TASK-035 está `Hecha`: guías visuales de bordes y centros, umbral 4 px,
sin snap. La grilla del lienzo es de 16 px (FR-09). El drag sigue en
una transacción (`beginTransaction` / `commitMove` /
`commitTransaction`). Hallazgo de producto 2026-09-29 (secuencia): las
lifelines quedan a distintas alturas y cuesta dejarlas en el mismo eje
(ver el gesto que alinea las cabeceras). No es kind nuevo ni bump de
schema. El botón de paleta es TASK-072; esta TASK solo crea el flag y
el snap.

## Dentro del alcance

- Flag de sesión `snapEnabled` en el estado de UI del editor (no en
  `DiagramDocument`, no en localStorage, no en el historial). Default
  **apagado**, para no cambiar el gesto actual hasta TASK-072.
- Con el flag apagado, la geometría del drag es la del puntero
  (TASK-035 sigue igual) y las guías se siguen pintando.
- Con el flag encendido, durante el drag de nodos (un nodo o una
  selección), cada eje se corrige así, en coordenadas de documento:
  1. Si un borde o el centro del grupo arrastrado está a **≤ 8 px** de
     un borde o centro de un elemento que **no** está en el gesto
     (izquierda / centro / derecha, o arriba / centro / abajo; las
     mismas referencias que `alignmentGuides.ts`), ese eje salta al
     objetivo más cercano.
  2. Si no hay objetivo en ese eje, el origen del grupo (`x` o `y`)
     salta al múltiplo de **16 px** más cercano.
- El grupo se mueve rígido: una sola corrección X y una sola Y para
  todos los nodos del gesto. No se encogen unos contra otros.
- Las guías de TASK-035 siguen visibles al quedar alineado. No entran
  en el PNG/JPG. Soltar confirma una sola entrada de historial, la del
  drag. Undo restaura la posición previa al gesto.
- Vale en todos los kinds que ya arrastran nodos (el ejemplo de
  lifelines es el motivo; no es exclusivo de secuencia).

## Fuera del alcance

- El botón de paleta (TASK-072).
- Snap al crear con click, al redimensionar, al nudge con flechas o
  en idle.
- Mover el `y` de un mensaje de secuencia (no es geometría de nodo).
- Auto-layout, waypoints, persistir el flag o las guías.
- Bajar el umbral de las guías visuales (siguen en 4 px). El umbral
  de imán es 8 px y no las sustituye.
- Schema, ADRs, paquetes.

## Archivos / módulos afectados

- `src/editor/interactions/alignmentGuides.ts` (o un módulo hermano
  `snap.ts` puro)
- tests colocalizados
- `src/editor/interactions/useNodeDrag.ts`
- `src/editor/interactions/nodeDrag.ts`
- `src/editor/store/editorStore.ts`
- `src/editor/store/actions.ts`
- `src/editor/store/editorStore.test.ts`
- `docs/tasks/post-024/13-editor/TASK-071.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

En un test, con `snapEnabled` y dos lifelines a distinta `y`, arrastrar
una hasta ≤ 8 px del borde superior de la otra deja ambas en el mismo
eje. Lejos de otros elementos, `x` e `y` caen en múltiplos de 16. Con
el flag apagado, el mismo gesto no imanta.

## Restricciones

- La función de snap no importa React ni `@xyflow/react`.
- `src/domain` no cambia de contrato salvo que el drag ya pase por
  `moveElements` con la posición ya corregida.
- Sin `any` injustificado. No persistir tipos de React Flow.

## Criterios de aceptación

- [x] `snapEnabled` default `false`. Apagado, el drag no altera la
      posición respecto del puntero.
- [x] Encendido, un eje a ≤ 8 px de un borde o centro ajeno salta a
      ese objetivo (el más cercano).
- [x] Encendido, un eje sin objetivo ajeno deja el origen en múltiplo
      de 16 px.
- [x] Una selección de varios nodos comparte la misma corrección; no
      se deforma.
- [x] Un gesto sigue siendo una entrada de historial; undo restaura.
- [x] Las guías no se serializan ni aparecen en el raster.
- [x] Schema `3` intacto.

## Tests

Unidad de la función pura: eje ajeno dentro de 8 px, fuera de 8 px
(cae a grilla), grupo rígido, flag apagado no llama al snap. Store:
el flag no entra en el documento ni en el snapshot de workspace.

## Comandos de verificación

```bash
npm run test -- src/editor/interactions src/editor/store/editorStore.test.ts
npm run typecheck
npm run lint
```

## Stop conditions

- Hace falta persistir el flag o un campo nuevo en el documento.
- Se pide auto-layout (colocar todo el diagrama de una vez).
- El umbral de 8 px o la grilla de 16 px deben ser configurables.

## Definition of Done

El drag imanta solo con el flag encendido; la grilla y los ejes ajenos
están cubiertos por tests; el documento no gana claves; criterios
`[x]` con evidencia.

## Evidencia de cierre

2026-09-29. Criterios `[x]`. `snapEnabled` nace en `false` y no entra
en el documento, el historial ni el snapshot de workspace. Con el flag,
un eje a ≤ 8 px salta al borde o centro ajeno más cercano; si no hay
objetivo, el origen del grupo cae en múltiplo de 16. Una selección
comparte un solo delta. Un gesto sigue siendo una entrada; undo
restaura la posición previa. Las guías siguen siendo chrome de
TASK-035 (no se serializan; el raster ya las excluye). Schema `3`
intacto. Sin commit.

Comandos realmente corridos:

```bash
npm run test -- src/editor/interactions src/editor/store/editorStore.test.ts
npx eslint src/editor/interactions/snap.ts src/editor/interactions/snap.test.ts src/editor/interactions/nodeDrag.ts src/editor/interactions/nodeDrag.test.ts src/editor/store/editorStore.ts src/editor/store/actions.ts src/editor/store/editorStore.test.ts
npm run typecheck
npm run lint
```

Unidad: 8 archivos, 64 tests. ESLint de los archivos tocados: limpio.
`npm run typecheck` falla solo en `e2e/include-extend.spec.ts`
(`SVGPathElement`, `DOMPoint`), ajeno a este cambio. `npm run lint`
falla en e2e previos (`alignment-guides`, `include-extend`, `minimap`,
`performance`); ningún archivo de esta TASK.
