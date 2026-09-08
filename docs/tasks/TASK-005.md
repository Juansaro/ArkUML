# TASK-005: Store del editor e historial transaccional

## Objetivo

Orquestar acciones semánticas y undo/redo sin duplicar la fuente de verdad ni grabar frames de drag.

## Prioridad

P0

## Dependencias

TASK-004

## Contexto obligatorio

- @docs/decisions/ADR-003-state-management.md
- @docs/architecture/architecture.md
- @docs/architecture/domain-model.md

## Estado inicial

Dominio puro testeado.

## Dentro del alcance

- Store Zustand 5: slices `document`, `selection`, `viewport`, `tool`, `history`, `ui` mínimo.
- Acciones que delegan en operaciones de dominio.
- `beginTransaction` / `commitTransaction` / `cancelTransaction`.
- Undo/redo; límite 100; nueva mutación limpia redo.
- Selectores pequeños.
- Tests del store **sin** render React Flow.

## Fuera del alcance

- Middleware `persist` de Zustand.
- Immer, Redux, zundo, DI.
- UI de botones undo (TASK-012).
- LocalStorage (TASK-006).

## Archivos / módulos afectados

- `src/editor/store/editorStore.ts`
- `src/editor/store/actions.ts`
- `src/editor/store/selectors.ts`
- `src/editor/store/history.ts`
- tests
- `package.json` (zustand 5)

## Cambios esperados

Componentes futuros no mutan arrays a mano.

## Restricciones

- Viewport, selección, hover y mensajes no entran en historial.
- No segundo modelo React Flow como fuente.

## Criterios de aceptación

- [ ] Crear, editar nombre, mover (vía commit), conectar, borrar son undo/redo.
- [ ] Cien updates dentro de una transacción = una entrada.
- [ ] Zoom/pan/selección no alteran historial.
- [ ] Más de 100 commits descarta el más antiguo.

## Tests

Transacciones, límite, redo invalidado, aislamiento de instancias, cada acción semántica.

## Comandos de verificación

```bash
npm run test -- src/editor/store
npm run typecheck
npm run lint
```

## Stop conditions

- Añadir persist middleware «por comodidad».

## Definition of Done

Store testeable sin canvas. Contrato de acciones lo bastante claro para TASK-006+.
