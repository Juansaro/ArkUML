# TASK-013: Relación Association

## Objetivo

Primera relación extremo a extremo y patrón de edges para las siguientes.

## Prioridad

P0

## Dependencias

TASK-012

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/domain-model.md
- @docs/architecture/rendering-and-export.md

## Estado inicial

Elementos editables; `createRelationship` existe en dominio.

## Dentro del alcance

- Modo paleta Association; drag entre handles.
- Preview válido/inválido; commit vía `canConnect`.
- Línea sólida sin flecha; hit area ampliada; selección accesible.
- Normalizar actor como source aunque el drag sea inverso.
- Seleccionar y eliminar la relación (Delete ya existe).
- Inspector: tipo y extremos; sin etiqueta editable.
- Undo/redo de create/delete.

## Fuera del alcance

- Include/Extend.
- Waypoints, routing, flechas, labels.
- Boundary como extremo.
- Duplicados equivalentes en sentido inverso (el dominio los unifica).

## Archivos / módulos afectados

- `src/editor/edges/AssociationEdge.tsx`
- `src/editor/tools/relationshipTool.ts`
- mapper, inspector
- tests / E2E

## Cambios esperados

Al mover extremos, la línea sigue conectada.

## Restricciones

Intento inválido no muta y anuncia razón concreta (código de dominio → mensaje).

## Criterios de aceptación

- [ ] Solo Actor–UseCase.
- [ ] Visual no sugiere navegación (sin flecha).
- [ ] Hit area no aparece en la exportación (filtro ya en spike; no pintar handles en export).

## Tests

Validación UI + normalización. E2E conectar, mover, seleccionar, borrar, undo.

## Comandos de verificación

```bash
npm run test -- src/editor/edges src/editor/tools src/domain/diagram
npm run test:e2e -- --project=chromium
npm run check
```

## Stop conditions

- Permitir actor–actor «temporalmente».

## Definition of Done

Patrón de tool de relación reutilizable para TASK-014.
