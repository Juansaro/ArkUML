# TASK-006: Repositorio LocalStorage y autosave

## Objetivo

Evitar pérdida de trabajo con persistencia mínima validada y sustituible.

## Prioridad

P0

## Dependencias

TASK-003, TASK-005

## Contexto obligatorio

- @docs/decisions/ADR-004-persistence.md
- @docs/architecture/domain-model.md
- @docs/architecture/architecture.md

## Estado inicial

Schema y store existen. No hay I/O.

## Dentro del alcance

- Interfaz `DiagramRepository` async: `load`, `save`, `clear`.
- Adapter LocalStorage, clave `arkuml:workspace:v1`.
- Autosave debounce 750 ms tras commit de historial; flush explícito; best-effort `beforeunload`.
- Estados idle / saving / saved / error + timestamp.
- No escribir en cada frame de drag.
- No sobrescribir datos inválidos al cargar.

## Fuera del alcance

- IndexedDB, Dexie, localForage.
- UX de diálogos «Nuevo diagrama» / recovery UI (TASK-015) — sí la API y errores tipados.
- Multi-tab sync.

## Archivos / módulos afectados

- `src/persistence/diagramRepository.ts`
- `src/persistence/localStorageDiagramRepository.ts`
- `src/persistence/autosaveCoordinator.ts`
- tests con storage fake y fake timers
- cableado mínimo al store (sin pantallas nuevas)

## Cambios esperados

Store puede hidratar y persistir. UI visible de status puede ser mínima o diferirse a TASK-015 si no hay shell; preferible dejar API de status en el slice `ui`.

## Restricciones

- Zod en load. Sin persist middleware.
- No importar React Flow.

## Criterios de aceptación

- [ ] Save + load round-trip de un documento válido (test).
- [ ] 100 updates transitorios de transacción abierta no escriben; el commit sí (tras debounce).
- [ ] Parse corrupto no pisa la clave.
- [ ] Quota simulada produce error tipado; el documento en memoria permanece.

## Tests

Fake storage, fake timers, cuota, corrupto, flush, contrato de interfaz.

## Comandos de verificación

```bash
npm run test -- src/persistence src/editor/store
npm run typecheck
npm run lint
```

## Stop conditions

- Usar IndexedDB «por si el JSON crece».

## Definition of Done

Errores tipados. Persistencia desacoplada. ADR-004 intacto.
