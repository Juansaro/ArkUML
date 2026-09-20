# TASK-055: Módulo de diagrama de componentes

## Estado documental

Hecha

## Objetivo

El editor abre y edita `"component"` completo (paleta, caja con icono,
uso, ensamblaje bola-zócalo, inspector, Nuevo).

## Prioridad

P0

## Dependencias

TASK-054

## Contexto obligatorio

- @docs/architecture/component-model.md
- @docs/architecture/diagram-kinds.md
- @docs/architecture/rendering-and-export.md
- @docs/product/brand-system.md
- @docs/product/post-mvp-spec.md
- @docs/decisions/ADR-002-diagram-engine.md
- @docs/decisions/ADR-006-export.md
- @.cursor/rules/testing.mdc

## Estado inicial

Dominio component existe. Nuevo no lista Componentes.

## Dentro del alcance

- Paleta: Selección; Componente; Uso; Ensamblaje.
- Lienzo: notación `component-model.md`; bola-zócalo en el edge.
- Inspector: nombre; kind y extremos de relación.
- Nuevo añade kind Componentes. Combobox: «Componentes».
- Addendum de iconos en `brand-system.md` **antes** de pintar.
- Export raster por `exportDiagram`. Pin intacto.

## Fuera del alcance

- Interface como nodo, puertos, artefactos internos.
- Despliegue y kinds posteriores.

## Archivos / módulos afectados

- `src/editor/nodes/`, `edges/`, mapper, paleta, inspector, Nuevo
- `docs/product/brand-system.md`
- E2E
- `docs/tasks/post-024/13-editor/TASK-055.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

El usuario crea componentes, los conecta y el selector los lista.
Módulos previos intactos.

## Restricciones

Host vacío prohibido. Notación = `component-model.md`. Sin kit.

## Criterios de aceptación

- [x] Paleta y lienzo propios; uso y ensamblaje visibles.
- [x] Nuevo Componentes añade a la biblioteca.
- [x] PNG sin shell. Clases/sequence/use-case intactos.
- [x] Iconos en addendum de marca.

## Tests

Unit mapper/nodos/edges. E2E create + connect + switch.

## Comandos de verificación

```bash
npx vitest run src/editor src/domain
npx playwright test --project=chromium
npx tsc -b --pretty false
```

## Stop conditions

- Se pide Port o Interface persistida.
- Paquete de iconos o segundo motor.

## Definition of Done

Módulo component completo.

## Evidencia de cierre

2026-09-20. Módulo de componentes conectado al shell: paleta Componente /
Uso / Ensamblaje; `ComponentNode` con icono UML; mapper y
`ComponentRelationshipEdge` (uso con «use», ensamblaje bola-zócalo);
inspector de nombre, kind y extremos; Nuevo y combobox con Componentes;
addendum de iconos en `brand-system.md`. Use-case, sequence y class
conservan sus herramientas.

Verificación: `npx vitest run src/editor src/domain` (383 tests pasan);
`npx playwright test --project=chromium` (70 tests pasan). `tsc -b`
conserva únicamente los dos errores previos de tipos DOM en
`e2e/include-extend.spec.ts`.
