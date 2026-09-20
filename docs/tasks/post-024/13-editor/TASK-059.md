# TASK-059: Módulo de diagrama entidad-relación

## Estado documental

Hecha

## Objetivo

El editor abre y edita `"entity-relationship"` completo (rectángulo,
elipse, rombo, enlaces, cardinalidad 1/N, inspector, Nuevo).

## Prioridad

P0

## Dependencias

TASK-058

## Contexto obligatorio

- @docs/architecture/er-model.md
- @docs/decisions/ADR-008-chen-er.md
- @docs/architecture/diagram-kinds.md
- @docs/architecture/rendering-and-export.md
- @docs/product/brand-system.md
- @docs/product/post-mvp-spec.md
- @docs/decisions/ADR-002-diagram-engine.md
- @docs/decisions/ADR-006-export.md
- @.cursor/rules/testing.mdc

## Estado inicial

Dominio ER existe. Nuevo no lista Entidad relación.

## Dentro del alcance

- Paleta: Selección; Entidad; Atributo; Relación (rombo). Herramienta
  de enlace origen → destino.
- Lienzo: notación Chen de `er-model.md`; nombre subrayado si `isKey`;
  «1»/«N» en el extremo entidad–rombo.
- Inspector: nombre; `isKey`; cardinalidad cuando aplica.
- Nuevo añade Entidad relación. Combobox: «Entidad relación».
- Addendum de iconos en `brand-system.md` **antes** de pintar.
- Export raster por `exportDiagram`. Pin intacto.

## Fuera del alcance

- Crow’s foot, entidad débil, actividades e IOD.

## Archivos / módulos afectados

- `src/editor/nodes/`, `edges/`, mapper, paleta, inspector, Nuevo
- `docs/product/brand-system.md`
- E2E
- `docs/tasks/post-024/13-editor/TASK-059.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

El usuario modela entidades Chen y el selector las lista.

## Restricciones

Host vacío prohibido. Notación = `er-model.md`. Sin kit.

## Criterios de aceptación

- [x] Paleta y lienzo Chen; cardinalidad visible en entidad–rombo.
- [x] Nuevo ER añade a la biblioteca.
- [x] PNG sin shell. Módulos previos intactos.
- [x] Iconos en addendum de marca.

## Tests

Unit mapper/nodos. E2E create + link + switch.

## Comandos de verificación

```bash
npx vitest run src/editor src/domain
npx playwright test --project=chromium
npx tsc -b --pretty false
```

## Stop conditions

- Se pide Crow’s foot o segundo motor.

## Definition of Done

Módulo ER completo.

## Evidencia de cierre

2026-09-20: módulo ER Chen; paleta Entidad/Atributo/Relación/Enlace;
EntityNode + AttributeNode (`isKey` subrayado) + ErRelationshipNode
(rombo) + ErLinkEdge con «1»/«N»; Nuevo y combobox «Entidad relación»;
addendum de iconos en `brand-system.md`. `npx vitest run src/editor
src/domain` (413 tests). `npx playwright test --project=chromium`
(72 tests). `tsc -p tsconfig.app.json` limpio. `tsc -b` sigue fallando
por `e2e/include-extend.spec.ts` (`SVGPathElement`/`DOMPoint` en
`tsconfig.node` sin lib DOM; preexistente, fuera de alcance). Pin
`html-to-image@1.11.11` intacto. Sin Crow’s foot ni entidad débil.
