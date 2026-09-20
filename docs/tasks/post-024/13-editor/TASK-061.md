# TASK-061: Módulo de diagrama de actividades

## Estado documental

Hecha

## Objetivo

El editor abre y edita `"activity"` completo (acción, inicial/final,
decisión/fusión, fork/join, flujos con guarda, inspector, Nuevo).

## Prioridad

P0

## Dependencias

TASK-060

## Contexto obligatorio

- @docs/architecture/activity-model.md
- @docs/architecture/diagram-kinds.md
- @docs/architecture/rendering-and-export.md
- @docs/product/brand-system.md
- @docs/product/post-mvp-spec.md
- @docs/decisions/ADR-002-diagram-engine.md
- @docs/decisions/ADR-006-export.md
- @.cursor/rules/testing.mdc

## Estado inicial

Dominio activity existe. Nuevo no lista Actividades.

## Dentro del alcance

- Paleta: Selección; Acción; Inicial; Final; Decisión; Fusión; Fork;
  Join; Flujo.
- Lienzo: notación `activity-model.md`; `[guard]` junto al flujo.
- Inspector: nombre; en flujo, guarda y extremos.
- Nuevo añade Actividades. Combobox: «Actividades».
- Addendum de iconos en `brand-system.md` **antes** de pintar.
- Export raster por `exportDiagram`. Pin intacto.

## Fuera del alcance

- Object flow, partitions, IOD.

## Archivos / módulos afectados

- `src/editor/nodes/`, `edges/`, mapper, paleta, inspector, Nuevo
- `docs/product/brand-system.md`
- E2E
- `docs/tasks/post-024/13-editor/TASK-061.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

El usuario dibuja un flujo de control y el selector lista el diagrama.

## Restricciones

Host vacío prohibido. Notación = `activity-model.md`. Sin kit.

## Criterios de aceptación

- [x] Paleta y lienzo propios; guarda visible.
- [x] Nuevo Actividades añade a la biblioteca.
- [x] PNG sin shell. Módulos previos intactos.
- [x] Iconos en addendum de marca.

## Tests

Unit mapper/nodos. E2E create + flow + switch.

## Comandos de verificación

```bash
npx vitest run src/editor src/domain
npx playwright test --project=chromium
npx tsc -b --pretty false
```

## Stop conditions

- Se pide object flow o segundo motor.

## Definition of Done

Módulo activity completo.

## Evidencia de cierre

2026-09-20: módulo activity; paleta Acción/Inicial/Final/Decisión/Fusión/
Fork/Join/Flujo; ActionNode + InitialNode + ActivityFinalNode +
DecisionNode (merge) + ForkNode (join) + ControlFlowEdge con `[guard]`;
Nuevo y combobox «Actividades»; addendum de iconos en `brand-system.md`.
`npx vitest run src/editor src/domain` (427 tests). `npx playwright
test --project=chromium` (73 tests). `tsc -p tsconfig.app.json` limpio.
`tsc -b` sigue fallando por `e2e/include-extend.spec.ts`
(`SVGPathElement`/`DOMPoint` en `tsconfig.node` sin lib DOM; preexistente,
fuera de alcance). Pin `html-to-image@1.11.11` intacto. Sin object flow
ni partitions.
