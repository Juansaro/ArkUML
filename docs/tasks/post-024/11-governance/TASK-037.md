# TASK-037: Freeze de la segunda wave Post-MVP

## Estado documental

Hecha

## Objetivo

Congelar la segunda wave autorizada y promover **solo** sus entradas maduras
del roadmap a TASK-038+, con contratos ejecutables. Schema `1`. Sin ADR
nuevo. W17-01/13 siguen bloqueadas.

## Prioridad

P0

## Dependencias

TASK-033, TASK-036

## Contexto obligatorio

- @docs/tasks/post-024/11-governance/TASK-033.md
- @docs/product/post-mvp-spec.md
- @docs/architecture/schema-evolution.md
- @docs/tasks/post-024/roadmap.md
- @docs/tasks/post-024/README.md
- @docs/development/task-template.md
- @docs/development/agent-workflow.md

## Estado inicial

Wave 1 (**Editor local sobre schema 1**) está `Hecha` (TASK-034, TASK-035).
TASK-036 catalogó multi-kind; no congeló implementación. W14-03, W13-03,
W15-03 y W17-05 están `Autorizado en spec` con decisiones cerradas. No hay
carpetas `14-persistence/`, `15-export/` ni `17-ecosystem/`.

## Dentro del alcance

- Nombrar la Wave 2 y acotarla a cuatro filas in-scope.
- Crear carpetas **solo** para esa wave.
- Redactar TASK-038+ **únicamente** para ítems `Lista`.
- Dejar el resto del roadmap (bloqueado, condicional, exclusión, autorizado
  no congelado) sin archivo TASK.
- Actualizar índice y puntero en `docs/tasks/README.md`.

## Fuera del alcance

- Implementar la wave.
- Inventar UML, paleta de clases, selector de `kind` o host vacío (W17-01,
  W17-13).
- Reabrir ADR-002/003/004/006.
- Bump de `schemaVersion` / `storageVersion`.
- Congelar Generalization, waypoints, IndexedDB, PDF, temas o TS7.

## Archivos / módulos afectados

- `docs/tasks/post-024/11-governance/TASK-037.md`
- `docs/tasks/post-024/14-persistence/TASK-038.md`
- `docs/tasks/post-024/13-editor/TASK-039.md`
- `docs/tasks/post-024/15-export/TASK-040.md`
- `docs/tasks/post-024/17-ecosystem/TASK-041.md`
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/roadmap.md`
- `docs/tasks/README.md`
- `docs/product/post-mvp-spec.md` (Wave 2; no el MVP)
- `README.md` (puntero de autorización Post-MVP)

## Cambios esperados

Hay un siguiente chat ejecutable (TASK-038). El catálogo deja de tratar
JSON, minimap, clipboard y el runbook como «solo spec».

## Restricciones

- Una TASK = contrato listo. Si falta una decisión UML/ADR, no se crea el
  archivo.
- Una TASK por chat sigue vigente.
- `mvp-spec.md` gana para el producto 1.x. El MVP no gana un segundo
  diagrama.

## Criterios de aceptación

- [x] Wave 2 nombrada y acotada.
- [x] Solo esa wave tiene TASK-038+.
- [x] Cada TASK nueva pasa el template (estado Lista, CA, stops, evidencia
      vacía).
- [x] W17-01/13 y el resto no maduro siguen en el roadmap, no como TASK.
- [x] Índice y `docs/tasks/README.md` apuntan al próximo contrato (038).

## Tests

Glob `docs/tasks/**/TASK-*.md`: IDs únicos, enlaces rotos ausentes.

## Comandos de verificación

```bash
git diff --check
```

No hay código. `npm run format:check` del repo entero sigue fallando en
archivos de chrome/tooltips de TASK-024; no reformatearlos.

## Stop conditions

- Se pide TASK para W17-13 / FR-P07 o para toda la fase 12–17.
- Se pide un ítem `Bloqueada` «para ir avanzando».

## Definition of Done

Segunda wave congelada; TASK-038+ existen solo donde el contrato es
ejecutable.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. Wave 2 **Intercambio y distribución sobre
schema 1**: W14-03, W13-03, W15-03, W17-05. Schema `1`. Sin ADR.

- [`14-persistence/TASK-038.md`](../14-persistence/TASK-038.md) — FR-P03,
  `Lista`.
- [`13-editor/TASK-039.md`](../13-editor/TASK-039.md) — FR-P04, `Lista`.
- [`15-export/TASK-040.md`](../15-export/TASK-040.md) — FR-P05, `Lista`.
- [`17-ecosystem/TASK-041.md`](../17-ecosystem/TASK-041.md) — FR-P06,
  `Lista`.

Sin implementación de producto. W17-01/13 siguen bloqueadas. No hay
`16-a11y/`.

Comandos realmente corridos:

```bash
git diff --check
```

`git diff --check`: OK.
`npm run format:check` no se reejecutó (misma desviación TASK-024 que
028–036). Esta TASK no reformateó esos archivos.

Glob `docs/tasks/**/TASK-*.md`: 41 archivos, IDs 001–041 únicos. Carpetas
nuevas: `14-persistence`, `15-export`, `17-ecosystem`. Sin `16-a11y/`.
