# TASK-015: Restore, recovery y nuevo diagrama

## Objetivo

Hacer visible y recuperable el ciclo de vida del único documento local.

## Prioridad

P0

## Dependencias

TASK-006, TASK-012

## Contexto obligatorio

- @docs/decisions/ADR-004-persistence.md
- @docs/product/mvp-spec.md
- @docs/architecture/architecture.md

## Estado inicial

Repository y autosave existen; UX incompleta.

## Dentro del alcance

- Bootstrap: hidratar snapshot válido o documento default **antes** de mostrar el editor.
- Status Guardando / Guardado / Error sin toast de éxito repetitivo.
- «Nuevo diagrama»: confirmación destructiva si hay cambios; foco atrapado; cancelar no toca datos; confirmar crea default, limpia historial, `clear`+save.
- Snapshot inválido: ofrecer comenzar limpio **sin** overwrite hasta confirmar.
- Ctrl/Cmd+S flush y anuncio.
- Quota/permiso: edición en memoria sigue; error accionable.

## Fuera del alcance

- Lista de documentos, sync multi-tab, import/export JSON, nube.
- Modal en cada autosave OK.

## Archivos / módulos afectados

- `src/app/bootstrap.ts`
- `src/editor/components/SaveStatus/*`
- `src/editor/components/NewDiagramDialog.tsx`
- tests y E2E reload / storage

## Cambios esperados

Reload conserva contenido y viewport. Status no parpadea durante drag.

## Restricciones

No perder documento en RAM si LocalStorage falla.

## Criterios de aceptación

- [ ] Reload round-trip E2E.
- [ ] Nuevo cancelado conserva; confirmado resetea a boundary «Sistema».
- [ ] Corrupción simulada no pisa hasta confirmar.

## Tests

Bootstrap restore/error. Dialog focus trap. E2E reload, nuevo, storage bloqueado si es simulable.

## Comandos de verificación

```bash
npm run test -- src/app src/persistence src/editor/components/SaveStatus
npm run test:e2e -- --project=chromium
npm run check
```

## Stop conditions

- Multi-documentos o IndexedDB.

## Definition of Done

Pérdida accidental mitigada. Errores accionables.
