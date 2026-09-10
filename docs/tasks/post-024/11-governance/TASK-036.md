# TASK-036: Catálogo Post-MVP de más tipos de diagrama

## Estado documental

Hecha

## Objetivo

Revisar el contrato Post-MVP: levantar la exclusión W17-01, documentar
una plataforma por `document.kind` (un solo documento activo) y
catalogar el diagrama de clases como primer tipo extra, bloqueado hasta
fuente UML y forma persistida.

## Prioridad

P0

## Dependencias

TASK-031, TASK-032

## Contexto obligatorio

- @docs/product/post-mvp-spec.md
- @docs/product/mvp-spec.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/domain-model.md
- @docs/architecture/architecture.md
- @docs/tasks/post-024/roadmap.md
- @docs/tasks/post-024/risk-register.md
- @docs/tasks/post-024/README.md
- @docs/development/task-template.md

## Estado inicial

W17-01 es exclusión («ArkUML no es UML genérico»). O-01 trata el segundo
tipo de diagrama como exclusión vigente. Wave 1 (TASK-034/035) está
`Hecha`. Un único documento activo; W14-02 y ADR-004 no se reabren. El
dominio ya anticipa unión por `kind` y `UNKNOWN_KIND`. Schema `1` del
árbol `src/` intacto. Sin freeze nuevo.

## Dentro del alcance

- Enmendar `post-mvp-spec.md`: W17-01, W17-13, FR-P07, O-01, non-goals
  y major 2.0.
- Publicar `docs/architecture/diagram-kinds.md` (puntos de extensión;
  sin metamodelo de clases).
- Anotar `document.kind` extra como bump en `schema-evolution.md`.
- Proyectar roadmap, risk-register e índice. Ajustar el enlace
  «Después del MVP» en `mvp-spec.md`.

## Fuera del alcance

- Código, pins, paleta de clases, selector de tipo en 1.x.
- Inventar atributos, asociaciones o Generalization de clases.
- Multi-documento, temas, segundo motor gráfico.
- Reabrir ADR-002/004/006.
- Crear `TASK-037+` ni congelar una wave.

## Archivos / módulos afectados

- `docs/tasks/post-024/11-governance/TASK-036.md`
- `docs/product/post-mvp-spec.md`
- `docs/architecture/diagram-kinds.md` (nuevo)
- `docs/architecture/schema-evolution.md`
- `docs/architecture/architecture.md` (puntero)
- `docs/architecture/domain-model.md` (puntero)
- `docs/tasks/post-024/roadmap.md`
- `docs/tasks/post-024/risk-register.md`
- `docs/tasks/post-024/README.md`
- `docs/product/mvp-spec.md` (enlace, no el MVP)
- `docs/decisions/README.md` (listar: ADR-004 no para W17-01/13; ADR-002
  addendum futuro)

## Cambios esperados

El backlog admite una línea 2.x multi-tipo. 1.x sigue siendo solo casos
de uso. Nadie implementa un class diagram «porque está en el catálogo».

## Restricciones

- `mvp-spec.md` gana para el producto actual.
- Un tipo extra sin fuente UML acordada **no** es FR.
- No preparar el host vacío (regla TASK-020).
- Schema `1` de `src/` no cambia.

## Criterios de aceptación

- [x] W17-01 deja de ser exclusión; es plataforma por `kind`, más tarde
      / bloqueada, P1.
- [x] W17-13 (clases) está en el catálogo, P1, bloqueada.
- [x] Existe FR-P07 (plataforma, no notación de clases), destino más
      tarde, acoplado a W17-13.
- [x] O-01 y non-goals ya no tratan el segundo tipo como exclusión
      absoluta. 1.x no persiste otro `kind`.
- [x] `diagram-kinds.md` publica puntos de extensión sin metamodelo de
      clases.
- [x] `schema-evolution.md` lista `document.kind` extra como bump; el
      envelope `arkuml-usecase-json` no se reutiliza para clases.
- [x] Roadmap, registro e índice coherentes. Sin TASK ejecutable nueva.
- [x] `src/` intacto.

## Tests

Revisión documental y enlaces.

## Comandos de verificación

```bash
git diff --check
```

No hay código. `npm run format:check` del repo entero sigue fallando en
archivos de chrome/tooltips de TASK-024; no reformatearlos.

## Stop conditions

- Se pide implementar el selector o la paleta de clases en 1.x.
- Se pide lista de diagramas (W14-02) o reabrir ADR-004.
- Se pide inventar el metamodelo de clases sin fuente UML.

## Definition of Done

Contrato y proyección actualizados; schema `1` e implementación intactos;
W17-13 bloqueada.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. Contrato enmendado en
`docs/product/post-mvp-spec.md`. Política en
`docs/architecture/diagram-kinds.md`. Schema `1` del árbol `src/`
intacto. W17-13 bloqueada. Sin TASK-037+ ni freeze. Ningún ADR
reabierto.

Decisiones:

- Un solo documento activo. W14-02 y ADR-004 no se reabren.
- 1.x sigue solo `use-case`. El primer `document.kind` extra es 2.0
  (`schemaVersion >= 2` + `migrate()` antes del primer save).
- W17-01: de exclusión a plataforma por `kind` (FR-P07), P1, más tarde /
  bloqueada hasta W17-13. Host vacío prohibido. Sin switcher en 1.x.
- W17-13: clases, P1, bloqueada (fuente UML, unión persistida, bump,
  addendum de marca; sin kit de iconos). No es FR hasta esos gates.
- Envelope `arkuml-usecase-json` no se reutiliza para clases.
- O-01: entran W17-01 y W17-13; paquetes y multiplicidad siguen
  exclusión.
- ADR-002/004 no se reabren; solo se listan reaperturas futuras.

Comandos realmente corridos:

```bash
git diff --check
```

`git diff --check`: OK.
`npm run format:check` del repo entero no se reejecutó para no tocar los
10 archivos de chrome/tooltips de TASK-024 (misma desviación que
028–035). Esta TASK no los reformateó.
