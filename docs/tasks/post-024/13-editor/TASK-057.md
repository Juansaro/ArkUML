# TASK-057: Módulo de diagrama de despliegue

## Estado documental

Lista

## Objetivo

El editor abre y edita `"deployment"` completo (nodo prisma, artefacto,
camino, deploy, inspector, Nuevo).

## Prioridad

P0

## Dependencias

TASK-056

## Contexto obligatorio

- @docs/architecture/deployment-model.md
- @docs/architecture/diagram-kinds.md
- @docs/architecture/rendering-and-export.md
- @docs/product/brand-system.md
- @docs/product/post-mvp-spec.md
- @docs/decisions/ADR-002-diagram-engine.md
- @docs/decisions/ADR-006-export.md
- @.cursor/rules/testing.mdc

## Estado inicial

Dominio deployment existe. Nuevo no lista Despliegue.

## Dentro del alcance

- Paleta: Selección; Nodo; Artefacto; Camino; Desplegar.
- Lienzo: prisma y artefacto según `deployment-model.md`.
- Inspector: nombre; kind y extremos.
- Nuevo añade Despliegue. Combobox: «Despliegue».
- Addendum de iconos en `brand-system.md` **antes** de pintar.
- Export raster por `exportDiagram`. Pin intacto.

## Fuera del alcance

- Nested nodes, Device distinto, ER y kinds posteriores.

## Archivos / módulos afectados

- `src/editor/nodes/`, `edges/`, mapper, paleta, inspector, Nuevo
- `docs/product/brand-system.md`
- E2E
- `docs/tasks/post-024/13-editor/TASK-057.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

El usuario crea nodos y artefactos, los conecta y el selector los lista.

## Restricciones

Host vacío prohibido. Notación = `deployment-model.md`. Sin kit.

## Criterios de aceptación

- [ ] Paleta y lienzo propios; path y deploy visibles.
- [ ] Nuevo Despliegue añade a la biblioteca.
- [ ] PNG sin shell. Módulos previos intactos.
- [ ] Iconos en addendum de marca.

## Tests

Unit mapper/nodos. E2E create + connect + switch.

## Comandos de verificación

```bash
npx vitest run src/editor src/domain
npx playwright test --project=chromium
npx tsc -b --pretty false
```

## Stop conditions

- Se pide nested node o segundo motor.

## Definition of Done

Módulo deployment completo.

## Evidencia de cierre

Pendiente.
