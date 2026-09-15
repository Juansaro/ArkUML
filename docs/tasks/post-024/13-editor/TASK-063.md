# TASK-063: Módulo de diagrama de interacción general

## Estado documental

Lista

## Objetivo

El editor abre y edita `"interaction-overview"` completo (marco `ref`,
nodos de control, flujos, inspector, Nuevo). Cierra Release 2 a nivel
de TASKs ejecutables.

## Prioridad

P0

## Dependencias

TASK-062

## Contexto obligatorio

- @docs/architecture/interaction-overview-model.md
- @docs/architecture/diagram-kinds.md
- @docs/architecture/rendering-and-export.md
- @docs/product/brand-system.md
- @docs/product/post-mvp-spec.md
- @docs/decisions/ADR-002-diagram-engine.md
- @docs/decisions/ADR-006-export.md
- @.cursor/rules/testing.mdc

## Estado inicial

Dominio IOD existe. Nuevo no lista Interacción general.

## Dentro del alcance

- Paleta: Selección; Interacción (ref); Inicial; Final; Decisión;
  Fusión; Fork; Join; Flujo.
- Lienzo: marco `ref` según el modelo; mismos nodos de control que
  actividades (proyección propia de este módulo).
- Inspector: `ref`; en flujo, guarda.
- Nuevo añade Interacción general. Combobox: «Interacción general».
- Addendum de iconos en `brand-system.md` **antes** de pintar.
- Export raster por `exportDiagram`. Pin intacto.
- Tras este módulo, «Nuevo» lista los kinds con módulo cerrado:
  use-case, sequence, class, component, deployment,
  entity-relationship, activity, interaction-overview.

## Fuera del alcance

- Inline Interaction, resolver `ref` a la biblioteca, fragmentos.
- Tag SemVer / `package.json`. IndexedDB.

## Archivos / módulos afectados

- `src/editor/nodes/`, `edges/`, mapper, paleta, inspector, Nuevo
- `docs/product/brand-system.md`
- E2E
- `docs/tasks/post-024/13-editor/TASK-063.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

El usuario crea un overview con marcos `ref` y el selector lo lista.
Los siete módulos de Release 2 + use-case + sequence coexisten.

## Restricciones

Host vacío prohibido. Notación = `interaction-overview-model.md`. Sin kit.

## Criterios de aceptación

- [ ] Paleta y lienzo propios; marco `ref` visible.
- [ ] Nuevo Interacción general añade a la biblioteca.
- [ ] PNG sin shell. Módulos previos intactos.
- [ ] Iconos en addendum de marca.
- [ ] Nuevo no ofrece kinds fuera de los ocho módulos cerrados.

## Tests

Unit mapper/nodos. E2E create + flow + switch a use-case.

## Comandos de verificación

```bash
npx vitest run src/editor src/domain
npx playwright test --project=chromium
npx tsc -b --pretty false
```

## Stop conditions

- Se pide inline sequence o `ref` a `document.id`.
- Paquete de iconos o segundo motor.

## Definition of Done

Módulo IOD completo. Release 2 de TASKs ejecutables cerrable cuando
esta TASK esté `Hecha`.

## Evidencia de cierre

Pendiente.
