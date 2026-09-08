# TASK-012: Eliminar, duplicar, atajos y undo/redo en UI

## Objetivo

Cerrar operaciones de alta frecuencia y exponer el historial al usuario.

## Prioridad

P1 (se implementa en el MVP; es «recomendado incluido»)

## Dependencias

TASK-005, TASK-011

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/decisions/ADR-003-state-management.md

## Estado inicial

Historial existe en store; UI no lo usa del todo.

## Dentro del alcance

- Delete/Backspace elimina selección y relaciones incidentes (cuando existan; si aún no hay edges, borrar nodos).
- Ctrl/Cmd+D duplica actores/casos, offset 24, sin relaciones; no duplica boundary.
- Undo/redo: Ctrl/Cmd+Z, Shift+Z, Ctrl/Cmd+Y; botones top bar con `canUndo`/`canRedo`.
- Ctrl/Cmd+0 fit view; Ctrl/Cmd+S flush autosave si persistence está cableada.
- Flechas / Shift+flechas mueven selección.
- Ignorar atajos destructivos dentro de input/textarea/contenteditable.
- Borrar boundary: casos a absolutas (ya en dominio).

## Fuera del alcance

- Duplicar relaciones o boundary.
- Incluir selección/viewport en undo.
- Diálogo de confirmar delete (undo basta).
- Nuevo diagrama (TASK-015).

## Archivos / módulos afectados

- `src/editor/shortcuts/useEditorShortcuts.ts`
- `src/editor/components/TopBar/*`
- tests y E2E teclado + toolbar

## Cambios esperados

Ayuda breve lista los atajos (panel o diálogo estático).

## Restricciones

No interceptar atajos del navegador salvo los listados.

## Criterios de aceptación

- [ ] Botones reflejan canUndo/canRedo.
- [ ] Undo restaura geometría y parent.
- [ ] Atajos no disparan durante edición de texto.
- [ ] Duplicar no copia edges.

## Tests

Mapa de shortcuts. Duplicar/borrar multi-select. E2E teclado + toolbar.

## Comandos de verificación

```bash
npm run test -- src/editor/shortcuts
npm run test:e2e -- --project=chromium
npm run check
```

## Stop conditions

- Confirmación modal en cada delete.

## Definition of Done

Atajos documentados en la ayuda de la app (no hace falta nuevo doc largo).
