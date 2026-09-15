# TASK-054: Dominio de componentes

## Estado documental

Lista

## Objetivo

El dominio schema 3 acepta `document.kind` `"component"` y las
operaciones puras de `component-model.md`. Sin UI.

## Prioridad

P0

## Dependencias

TASK-053

## Contexto obligatorio

- @docs/architecture/component-model.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/domain-model.md
- @docs/architecture/diagram-kinds.md
- @docs/product/post-mvp-spec.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

Clases están en la unión schema 3 y tienen chrome. `"component"` es
`UNKNOWN_KIND`.

## Dentro del alcance

- Añadir `"component"` a la unión de `document.kind` (sigue schema 3).
- Tipos, factories, reglas, Zod: `component`, `component-usage`,
  `assembly-connector`.
- Sin mezcla con otros módulos. `createEmptyComponentDocument()`.
- Envelope `formatVersion` 3 acepta este kind (misma familia).
- Tests de dominio.

## Fuera del alcance

- Paleta y nodos (TASK-055). Interface como elemento, puertos,
  delegation. Resto de kinds Release 2.

## Archivos / módulos afectados

- `src/domain/diagram/` (schema, factories, operations, rules, validation, documentFile)
- `docs/architecture/domain-model.md`
- `docs/tasks/post-024/12-uml/TASK-054.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un documento component se construye y muta en tests. El parser rechaza
`deployment` todavía.

## Restricciones

Zod `strictObject`. `src/domain` sin UI. Pins intactos.

## Criterios de aceptación

- [ ] Factory vacía; create/rename/move/delete de component; cascada.
- [ ] `component-usage` y `assembly-connector`; self ilegal.
- [ ] Mezclas `UNKNOWN_KIND`. Use-case/sequence/class intactos.
- [ ] Archivo 3.x round-trip de un document component.

## Tests

Factory, `canConnect`, rechazo de kind futuro, no-mezcla.

## Comandos de verificación

```bash
npx vitest run src/domain
npx tsc -b --pretty false
```

## Stop conditions

- Se pide pintar o Interface persistida.
- Se pide bump a schema 4.

## Definition of Done

Dominio component testeado; sin chrome.

## Evidencia de cierre

Pendiente.
