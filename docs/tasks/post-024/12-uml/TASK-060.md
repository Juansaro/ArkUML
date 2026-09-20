# TASK-060: Dominio de actividades

## Estado documental

Hecha

## Objetivo

El dominio schema 3 acepta `document.kind` `"activity"` y las
operaciones de `activity-model.md`. Sin UI.

## Prioridad

P0

## Dependencias

TASK-059

## Contexto obligatorio

- @docs/architecture/activity-model.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/domain-model.md
- @docs/architecture/diagram-kinds.md
- @docs/product/post-mvp-spec.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

ER tiene chrome. `"activity"` es `UNKNOWN_KIND`.

## Dentro del alcance

- Añadir `"activity"` a la unión (schema 3).
- Nodos de `activity-model.md` y `control-flow` con `guard`.
- `initial-node` no es destino; `activity-final` no es origen.
- `createEmptyActivityDocument()`. Envelope 3.x acepta este kind.

## Fuera del alcance

- Chrome (TASK-061). Object flow, particiones, pins. IOD.

## Archivos / módulos afectados

- `src/domain/diagram/`
- `docs/architecture/domain-model.md`
- `docs/tasks/post-024/12-uml/TASK-060.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un documento activity se muta en tests. El parser rechaza
`interaction-overview` todavía.

## Restricciones

Zod `strictObject`. `src/domain` sin UI.

## Criterios de aceptación

- [x] Factories de los siete nodos; cascada de flujos.
- [x] `control-flow` + guarda; self ilegal; reglas initial/final.
- [x] Mezclas `UNKNOWN_KIND`. Archivo 3.x round-trip.

## Tests

`canConnect` initial/final, factory, no-mezcla.

## Comandos de verificación

```bash
npx vitest run src/domain
npx tsc -b --pretty false
```

## Stop conditions

- Se pide object flow, pins o pintar.

## Definition of Done

Dominio activity testeado; sin chrome.

## Evidencia de cierre

2026-09-20: dominio `"activity"` schema 3; siete nodos + `control-flow`
con `guard`; `initial-node` no destino / `activity-final` no origen;
`createEmptyActivityDocument`; mezclas `UNKNOWN_KIND`; envelope 3.x
round-trip; `interaction-overview` sigue rechazado. Ajuste mínimo en
`cloneElementCopy` del store para compilar tras ampliar `ElementCopy`.
Verificación: `npx vitest run src/domain` (185 ok); `npx tsc -b
--pretty false`: app limpia; fallos previos en
`e2e/include-extend.spec.ts` (`SVGPathElement` / `DOMPoint` sin DOM en
`tsconfig.node.json`).
