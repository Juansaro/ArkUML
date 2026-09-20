# TASK-058: Dominio entidad-relación Chen

## Estado documental

Hecha

## Objetivo

El dominio schema 3 acepta `document.kind` `"entity-relationship"` y las
operaciones de `er-model.md` (ADR-008). Sin UI.

## Prioridad

P0

## Dependencias

TASK-057

## Contexto obligatorio

- @docs/architecture/er-model.md
- @docs/decisions/ADR-008-chen-er.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/domain-model.md
- @docs/architecture/diagram-kinds.md
- @docs/product/post-mvp-spec.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

Despliegue tiene chrome. `"entity-relationship"` es `UNKNOWN_KIND`.

## Dentro del alcance

- Añadir `"entity-relationship"` a la unión (schema 3).
- `entity`, `attribute` (`isKey`), `er-relationship`, `er-link` con
  `cardinality` `"1" | "N"` solo en entidad–rombo.
- `createEmptyErDocument()`. Envelope 3.x acepta este kind.
- Tests: atributo enlaza a una sola entidad; atributo–rombo ilegal.

## Fuera del alcance

- Chrome (TASK-059). Crow’s foot, entidad débil, atributo compuesto.
- Actividades e IOD.

## Archivos / módulos afectados

- `src/domain/diagram/`
- `docs/architecture/domain-model.md`
- `docs/tasks/post-024/12-uml/TASK-058.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un documento ER se muta en tests. El parser rechaza `"activity"` todavía.

## Restricciones

Zod `strictObject`. `src/domain` sin UI. No inventar Chen fuera del modelo.

## Criterios de aceptación

- [x] Factories entidad/atributo/rombo; `isKey`; cascada de `er-link`.
- [x] `canConnect` solo los pares de `er-model.md`; cardinalidad en
      entidad–rombo; prohibida en atributo–entidad.
- [x] Segundo enlace de un atributo → `INVALID_CONNECTION`.
- [x] Mezclas `UNKNOWN_KIND`. Archivo 3.x round-trip.

## Tests

Factory, matriz `canConnect`, no-mezcla.

## Comandos de verificación

```bash
npx vitest run src/domain
npx tsc -b --pretty false
```

## Stop conditions

- Se pide Crow’s foot, pintar, o `ref` a un class diagram.

## Definition of Done

Dominio ER testeado; sin chrome.

## Evidencia de cierre

2026-09-20. Dominio ER Chen en schema 3. Unión
`"use-case" | "sequence" | "class" | "component" | "deployment" | "entity-relationship"`.
Parser rechaza `activity` y mezclas (`UNKNOWN_KIND`). Elementos
`entity` / `attribute` (`isKey`) / `er-relationship`; relación `er-link`;
`canConnect` solo atributo–entidad y entidad–rombo; cardinalidad `"1"|"N"`
solo en entidad–rombo (default `"N"`); prohibida en atributo–entidad;
segundo enlace de un atributo → `INVALID_CONNECTION`; self ilegal;
cascada al borrar; `createEmptyErDocument()`; entidad `160×80` (mín.
`96×48`), atributo `120×56` (mín. `80×40`), rombo `120×80` (mín. `80×48`).
Envelope `formatVersion` 3 round-trip. Kinds previos intactos. Sin
paleta ni nodos (TASK-059). Navegador no usado: verificación solo
dominio/unitaria. Ajuste mínimo en `cloneElementCopy` del store para
compilar tras ampliar `ElementCopy`.

Comandos: `npx vitest run src/domain` (177 tests) y
`npx tsc -b --pretty false`: app limpia; fallos previos en
`e2e/include-extend.spec.ts` (`SVGPathElement` / `DOMPoint` sin DOM
en `tsconfig.node.json`) — sucio anterior, no tocado.
