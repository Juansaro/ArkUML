# TASK-011: Contención, reparent y resize del boundary

## Objetivo

Geometría padre-hijo correcta: casos dentro del sistema se mueven con él; entrar/salir convierte coordenadas; resize mínimo 320×240.

## Prioridad

P0

## Dependencias

TASK-010

## Contexto obligatorio

- @docs/architecture/domain-model.md
- @docs/architecture/rendering-and-export.md
- @docs/product/mvp-spec.md

## Estado inicial

Drag de nodos funciona en absolutas.

## Dentro del alcance

- Boundary usa sub-flow: hijos `parentId`, posición relativa.
- Mover boundary mueve hijos visualmente.
- Al soltar un UseCase, si el centro entra/sale del rectángulo, reparent + conversión para no saltar.
- Resize del boundary (NodeResizer o equivalente), una transacción, mínimo 320×240.
- Warnings no bloqueantes: actor dentro; use case fuera (según spec).
- Actor nunca se reparenta.

## Fuera del alcance

- Forzar actores fuera o casos dentro.
- Resize de actor/use case.
- Múltiples boundaries.

## Archivos / módulos afectados

- `src/editor/interactions/reparent.ts` (o similar)
- `src/editor/nodes/SystemBoundaryNode.tsx`
- mapper (orden padres/hijos)
- tests de conversión
- E2E drag into/out y resize

## Cambios esperados

Ningún salto visual al reparentar. Undo restaura parent y geometría.

## Restricciones

Orden de nodos: padre antes que hijos.

## Criterios de aceptación

- [ ] Reparent conserva posición en pantalla.
- [ ] Resize no genera una entrada por frame.
- [ ] Warnings visibles y anunciables (live region o inspector).

## Tests

Conversiones unitarias. E2E reparent y resize.

## Comandos de verificación

```bash
npm run test -- src/editor/interactions src/domain/diagram
npm run test:e2e -- --project=chromium
npm run check
```

## Stop conditions

- Segundo nivel de anidación (boundary en boundary).

## Definition of Done

Contrato relativo explícito cubierto por tests. Spec de warnings cumplida.
