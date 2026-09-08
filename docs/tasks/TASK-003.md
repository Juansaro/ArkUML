# TASK-003: Modelo de documento v1 y schema runtime

## Objetivo

Definir `DiagramDocument` / `WorkspaceSnapshot` versionados, validables con Zod, independientes del motor visual.

## Prioridad

P0

## Dependencias

TASK-002

## Contexto obligatorio

- @docs/architecture/domain-model.md
- @docs/product/mvp-spec.md
- @.cursor/rules/domain.mdc
- @docs/decisions/ADR-004-persistence.md

## Estado inicial

Harness de tests listo. No hay dominio.

## Dentro del alcance

- Tipos y factories: Actor, UseCase, SystemBoundary, Relationship, metadata, viewport.
- Schema Zod 4 estricto; parse seguro con errores de dominio.
- IDs UUID encapsulados; timestamps ISO.
- Factory de documento nuevo con boundary «Sistema».
- Tests de round-trip, rechazos (kind, UUID, geometría no finita, parent inválido, claves extra).
- El snapshot **no** incluye selección, historial ni tool.

## Fuera del alcance

- Operaciones canConnect/delete/duplicate (TASK-004).
- Store, React, React Flow.
- Persistencia LocalStorage (TASK-006) — solo schema/factories.
- Estilos visuales persistidos.

## Archivos / módulos afectados

- `src/domain/diagram/model.ts`
- `src/domain/diagram/schema.ts`
- `src/domain/diagram/defaults.ts`
- `src/domain/diagram/factories.ts`
- tests colocalizados
- `package.json` (añadir `zod@4`)

## Cambios esperados

Dependencia Zod justificada por ADR-004. Dominio sin imports de React/xyflow.

## Restricciones

- No clases, no event sourcing, no plugin registry.
- No guardar tipos `Node`/`Edge`.
- Actor sin `parentId`; UseCase `parentId` opcional de boundary; boundary sin padre.

## Criterios de aceptación

- [ ] `schemaVersion = 1`, `kind = "use-case"`, `storageVersion = 1`.
- [ ] Factory crea IDs, timestamps y un boundary válido.
- [ ] Datos corruptos producen error legible, no throw opaco.
- [ ] Cero imports de React o `@xyflow/react` en `src/domain`.

## Tests

Round-trip válido; rechazos listados; snapshot sin estado efímero.

## Comandos de verificación

```bash
npm run test -- src/domain/diagram
npm run typecheck
npm run lint
```

## Stop conditions

- Necesidad percibida de persistir campos de React Flow.

## Definition of Done

Cobertura de este módulo en camino al objetivo de dominio (>=90 % líneas / >=85 % ramas al cerrar TASK-004). Modelo alineado con domain-model.md.
