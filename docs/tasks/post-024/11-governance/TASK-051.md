# TASK-051: Freeze Release 2 (seis kinds, schema 3)

## Estado documental

Hecha

## Objetivo

Revisar el contrato Post-MVP y congelar el ciclo **Release 2**: seis
`document.kind` nuevos (clases, componentes, despliegue, entidad-relación
Chen, actividades, interacción general) sobre la biblioteca 2.0. Línea
de producto **3.0** (`schemaVersion` 3; `storageVersion` 2). Promover
**solo** las entradas maduras a TASK-052–063.

## Prioridad

P0

## Dependencias

TASK-045, TASK-050

## Contexto obligatorio

- @docs/product/post-mvp-spec.md
- @docs/product/mvp-spec.md
- @docs/product/brand-system.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/diagram-kinds.md
- @docs/architecture/domain-model.md
- @docs/architecture/sequence-model.md
- @docs/decisions/README.md
- @docs/decisions/ADR-002-diagram-engine.md
- @docs/decisions/ADR-007-workspace-library.md
- @docs/tasks/post-024/roadmap.md
- @docs/tasks/post-024/README.md
- @docs/development/task-template.md
- @docs/development/agent-workflow.md

## Estado inicial

Release 1 (TASK-045–050) está `Hecha`: biblioteca, secuencia, envelope
`arkuml-document-json` v2. W17-13 clases está bloqueada (sin fuente ni
forma). Componentes, despliegue, ER, actividades e IOD no existen en el
catálogo. El humano pide Release 2 con esos seis tipos; ER = Chen;
orden estructural → comportamental. `src/` permanece schema 2 / storage
2. `package.json` es `0.0.0`.

## Dentro del alcance

- Enmendar `post-mvp-spec.md`: Release 2 = línea 3.0; FR-R04–R09;
  W17-13 in-scope; W17-15–19; W12-02/W12-06 levantados **solo** en
  clases/ER; O-01; non-goals (fragmentos de secuencia, IndexedDB, temas,
  Crow’s foot).
- Publicar metamodelos: `class-model.md`, `component-model.md`,
  `deployment-model.md`, `er-model.md`, `activity-model.md`,
  `interaction-overview-model.md`.
- Publicar [ADR-008](../../../decisions/ADR-008-chen-er.md) y addendum
  de proyección en ADR-002 (sin segundo motor).
- Enmendar `diagram-kinds.md`, `schema-evolution.md` (schema 3,
  `formatVersion` 3, `migrate` `2→3`), punteros de arquitectura/dominio,
  `brand-system.md` (tagline por kind; iconos en cada TASK de chrome),
  roadmap, registro e índices.
- Crear TASK-052–063 **únicamente** para ítems `Lista`.
- Unión Zod **aditiva**: un kind no entra al parser hasta su TASK de
  dominio; «Nuevo» no lo ofrece hasta su TASK de módulo.

## Fuera del alcance

- Código en `src/` o `e2e/`.
- Inventar UML/Chen fuera de cada `*-model.md`.
- IndexedDB, sync, temas, PDF, Crow’s foot, Generalization en casos de
  uso, fragmentos de secuencia, Interaction inline, `ref` a otro
  documento.
- Tag SemVer ni cambiar `package.json`.
- Congelar el resto de las fases 12–17 (waypoints, PDF, a11y SR).

## Archivos / módulos afectados

- `docs/tasks/post-024/11-governance/TASK-051.md`
- `docs/tasks/post-024/12-uml/TASK-052.md`
- `docs/tasks/post-024/13-editor/TASK-053.md`
- `docs/tasks/post-024/12-uml/TASK-054.md`
- `docs/tasks/post-024/13-editor/TASK-055.md`
- `docs/tasks/post-024/12-uml/TASK-056.md`
- `docs/tasks/post-024/13-editor/TASK-057.md`
- `docs/tasks/post-024/12-uml/TASK-058.md`
- `docs/tasks/post-024/13-editor/TASK-059.md`
- `docs/tasks/post-024/12-uml/TASK-060.md`
- `docs/tasks/post-024/13-editor/TASK-061.md`
- `docs/tasks/post-024/12-uml/TASK-062.md`
- `docs/tasks/post-024/13-editor/TASK-063.md`
- `docs/architecture/class-model.md`
- `docs/architecture/component-model.md`
- `docs/architecture/deployment-model.md`
- `docs/architecture/er-model.md`
- `docs/architecture/activity-model.md`
- `docs/architecture/interaction-overview-model.md`
- `docs/decisions/ADR-008-chen-er.md`
- `docs/decisions/ADR-002-diagram-engine.md` (addendum)
- `docs/decisions/README.md`
- `docs/product/post-mvp-spec.md`
- `docs/architecture/diagram-kinds.md`
- `docs/architecture/schema-evolution.md`
- `docs/architecture/architecture.md`
- `docs/architecture/domain-model.md`
- `docs/product/mvp-spec.md` (enlace «Después del MVP»)
- `docs/product/brand-system.md` (tagline por kind)
- `docs/tasks/post-024/roadmap.md`
- `docs/tasks/post-024/risk-register.md`
- `docs/tasks/post-024/README.md`
- `docs/tasks/README.md`
- `README.md` (puntero de autorización)

## Cambios esperados

Hay un siguiente chat ejecutable (TASK-052). W17-13 deja de estar
bloqueada. Nadie implementa los seis módulos en un solo chat ni pinta
un kind cuyo dominio no esté `Hecha`.

## Restricciones

- Una TASK = contrato listo. Si faltara fuente, no se crea el chrome.
- Una TASK por chat.
- `mvp-spec.md` gana para la notación y reglas de **casos de uso**.
- Release 2 no es el tag `2.0.0` de Release 1.
- Sin paquetes nuevos (ni kit de iconos).

## Criterios de aceptación

- [x] Ciclo nombrado **Release 2**; línea de producto **3.0**.
- [x] `schemaVersion` 3; `storageVersion` 2; envelope `formatVersion` 3.
- [x] W17-13 in-scope; `class-model.md` cita UML 2.5.1 §9/§11.
- [x] W17-15–19 in-scope con metamodelo cerrado cada uno.
- [x] ER Chen: ADR-008; no es Crow’s foot ni class-as-ER.
- [x] IOD: UML 2.5.1 §17.9; `ref` por nombre, no por id de biblioteca.
- [x] W12-02/W12-06 levantados solo en clases/ER; casos de uso intactos.
- [x] Host vacío prohibido; Nuevo no lista un kind sin módulo.
- [x] Solo esta wave tiene TASK-052–063; cada una pasa el template.
- [x] Índice y `docs/tasks/README.md` apuntan al próximo contrato (052).
- [x] `src/` intacto.

## Tests

Glob `docs/tasks/**/TASK-*.md`: IDs únicos, enlaces rotos ausentes.

## Comandos de verificación

```bash
git diff --check
```

No hay código. No reformatear chrome ajeno.

## Stop conditions

- Se pide metamodelo sin fuente (aquí cada kind cita UML 2.5.1 o Chen).
- Se pide IndexedDB, Crow’s foot, fragmentos, Interaction inline o un
  host vacío «por si acaso».
- Se pide TASK para toda la fase 12–17 restante (PDF, waypoints, SR).

## Definition of Done

Release 2 congelado; TASK-052+ existen solo donde el contrato es
ejecutable. Sin implementación de producto.

## Evidencia de cierre

2026-09-14. Criterios `[x]`. Wave **Release 2 — Seis kinds (schema 3)**.

Decisiones cerradas:

- Nombre de ciclo **Release 2**; SemVer de producto **3.0.0** en el
  primer tag de esta línea (cuando 052–063 estén `Hecha`). No es el
  `2.0.0` de Release 1.
- `schemaVersion` 3; `storageVersion` 2 (ADR-007 intacto);
  `formatVersion` 3; `migrateDocument` `2→3`.
- Unión Zod aditiva por TASK de dominio; Nuevo solo con módulo.
- Orden: clases → componentes → despliegue → ER → actividades → IOD.
- Subconjuntos: ver cada `*-model.md`. Motor: addendum ADR-002.
- ER = Chen (ADR-008). IOD `ref` = string.
- W17-13 desbloqueada. IndexedDB, sync, temas, PDF, Crow’s foot,
  Generalization en use-case, fragmentos: fuera.

Hijos:

- [`12-uml/TASK-052.md`](../12-uml/TASK-052.md) — dominio clases + schema 3.
- [`13-editor/TASK-053.md`](../13-editor/TASK-053.md) — módulo clases.
- [`12-uml/TASK-054.md`](../12-uml/TASK-054.md) — dominio componentes.
- [`13-editor/TASK-055.md`](../13-editor/TASK-055.md) — módulo componentes.
- [`12-uml/TASK-056.md`](../12-uml/TASK-056.md) — dominio despliegue.
- [`13-editor/TASK-057.md`](../13-editor/TASK-057.md) — módulo despliegue.
- [`12-uml/TASK-058.md`](../12-uml/TASK-058.md) — dominio ER Chen.
- [`13-editor/TASK-059.md`](../13-editor/TASK-059.md) — módulo ER.
- [`12-uml/TASK-060.md`](../12-uml/TASK-060.md) — dominio actividades.
- [`13-editor/TASK-061.md`](../13-editor/TASK-061.md) — módulo actividades.
- [`12-uml/TASK-062.md`](../12-uml/TASK-062.md) — dominio IOD.
- [`13-editor/TASK-063.md`](../13-editor/TASK-063.md) — módulo IOD.

Comandos realmente corridos:

```bash
git diff --check
```

`git diff --check`: OK (avisos CRLF de Git en Windows, sin conflictos de
marcadores). Glob `docs/tasks/**/TASK-*.md`: 63 archivos, IDs 001–063
únicos. `src/` no se tocó en este freeze. Sin `16-a11y/`.
