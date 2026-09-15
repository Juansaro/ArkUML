# TASK-062: Dominio de interacción general

## Estado documental

Lista

## Objetivo

El dominio schema 3 acepta `document.kind` `"interaction-overview"` y
las operaciones de `interaction-overview-model.md`. Sin UI.

## Prioridad

P0

## Dependencias

TASK-061

## Contexto obligatorio

- @docs/architecture/interaction-overview-model.md
- @docs/architecture/activity-model.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/domain-model.md
- @docs/architecture/diagram-kinds.md
- @docs/product/post-mvp-spec.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

Actividades tienen chrome. `"interaction-overview"` es `UNKNOWN_KIND`.

## Dentro del alcance

- Añadir `"interaction-overview"` a la unión (schema 3).
- `interaction-occurrence` (`name` = `ref` string 1–80) + nodos de
  control y `control-flow` como actividad. **Sin** `action`.
- `createEmptyInteractionOverviewDocument()`. Envelope 3.x acepta este
  kind. `ref` no es UUID de biblioteca.

## Fuera del alcance

- Chrome (TASK-063). Interaction inline. Resolver `ref` a un sequence
  document. Fragmentos.

## Archivos / módulos afectados

- `src/domain/diagram/`
- `docs/architecture/domain-model.md`
- `docs/tasks/post-024/12-uml/TASK-062.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un documento IOD se muta en tests. Un `action` dentro de IOD es
`UNKNOWN_KIND`.

## Restricciones

Zod `strictObject`. `src/domain` sin UI. No persistir id de otro
documento en `ref`.

## Criterios de aceptación

- [ ] Factory occurrence + nodos de control; cascada de flujos.
- [ ] `ref` 1–80; reglas initial/final iguales que activity.
- [ ] No hay `action` en este kind. Mezclas `UNKNOWN_KIND`.
- [ ] Archivo 3.x round-trip.

## Tests

Factory, `canConnect`, rechazo de UUID-as-ref no aplica (es string);
rechazo de `action` en IOD.

## Comandos de verificación

```bash
npx vitest run src/domain
npx tsc -b --pretty false
```

## Stop conditions

- Se pide inline sequence, `ref` a `document.id`, o pintar.

## Definition of Done

Dominio IOD testeado; sin chrome.

## Evidencia de cierre

Pendiente.
