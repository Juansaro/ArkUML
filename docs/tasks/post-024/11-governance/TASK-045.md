# TASK-045: Freeze Release 1 (biblioteca y secuencia)

## Estado documental

Hecha

## Objetivo

Revisar el contrato Post-MVP y congelar el ciclo **Release 1**: biblioteca
local de documentos, selector con búsqueda en la top bar, y diagrama de
secuencia como primer `document.kind` extra. Línea de producto **2.0**
(schema `2` / storage `2`). Promover **solo** las entradas maduras a
TASK-046+.

## Prioridad

P0

## Dependencias

TASK-036, TASK-037, TASK-044

## Contexto obligatorio

- @docs/product/post-mvp-spec.md
- @docs/product/mvp-spec.md
- @docs/product/brand-system.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/diagram-kinds.md
- @docs/architecture/domain-model.md
- @docs/decisions/README.md
- @docs/decisions/ADR-004-persistence.md
- @docs/decisions/ADR-003-state-management.md
- @docs/tasks/post-024/roadmap.md
- @docs/tasks/post-024/README.md
- @docs/development/task-template.md
- @docs/development/agent-workflow.md

## Estado inicial

Wave 1 y Wave 2 están `Hecha`. Remediación 1.x (TASK-042–044) está
`Hecha`. W14-02 es exclusión. W17-01/13 están bloqueadas; el primer tipo
extra catalogado es clases, sin fuente UML. Schema y storage en `src/`
siguen `1`. `package.json` es `0.0.0`. El humano pide un ciclo llamado
**Release 1** con selector de diagramas (búsqueda al desplegar) y
diagrama de secuencia.

## Dentro del alcance

- Enmendar `post-mvp-spec.md`: Release 1 = línea 2.0; FR-R01/R02/R03;
  levantar W14-02; W17-14 secuencia; FR-P07 in-scope acoplado a secuencia;
  W17-13 clases sigue bloqueada.
- Publicar [ADR-007](../../../decisions/ADR-007-workspace-library.md) y
  addendum en ADR-004 / ADR-003 (historial por `document.id`).
- Publicar [`sequence-model.md`](../../../architecture/sequence-model.md)
  con fuente UML 2.5.1 y subconjunto cerrado.
- Enmendar `diagram-kinds.md`, `schema-evolution.md`, punteros de
  arquitectura/dominio, `brand-system.md` (chrome del combobox; iconos de
  secuencia se cierran en TASK-049), roadmap, registro e índices.
- Crear TASK-046–050 **únicamente** para ítems `Lista`.
- Nombrar el envelope 2.x: `arkuml-document-json` / `formatVersion` 2.

## Fuera del alcance

- Código en `src/` o `e2e/`.
- Inventar fragmentos, async, activaciones o clases.
- IndexedDB, sync, temas, PDF, Generalization, segundo motor.
- Tag SemVer ni cambiar `package.json`.
- Congelar el resto de las fases 12–17.

## Archivos / módulos afectados

- `docs/tasks/post-024/11-governance/TASK-045.md`
- `docs/tasks/post-024/12-uml/TASK-046.md`
- `docs/tasks/post-024/14-persistence/TASK-047.md`
- `docs/tasks/post-024/13-editor/TASK-048.md`
- `docs/tasks/post-024/13-editor/TASK-049.md`
- `docs/tasks/post-024/14-persistence/TASK-050.md`
- `docs/decisions/ADR-007-workspace-library.md`
- `docs/architecture/sequence-model.md`
- `docs/product/post-mvp-spec.md`
- `docs/architecture/diagram-kinds.md`
- `docs/architecture/schema-evolution.md`
- `docs/architecture/architecture.md`
- `docs/architecture/domain-model.md`
- `docs/product/mvp-spec.md` (enlace «Después del MVP»)
- `docs/product/brand-system.md` (combobox)
- `docs/decisions/ADR-004-persistence.md` (addendum)
- `docs/decisions/ADR-003-state-management.md` (addendum)
- `docs/decisions/README.md`
- `docs/tasks/post-024/roadmap.md`
- `docs/tasks/post-024/risk-register.md`
- `docs/tasks/post-024/README.md`
- `docs/tasks/README.md`
- `README.md` (puntero de autorización)

## Cambios esperados

Hay un siguiente chat ejecutable (TASK-046). El catálogo deja de tratar
la biblioteca y la secuencia como exclusión o bloqueo. Nadie implementa
clases «porque el freeze habla de 2.0».

## Restricciones

- Una TASK = contrato listo. Si faltara fuente UML de secuencia, no se
  habría creado TASK-049.
- Una TASK por chat.
- `mvp-spec.md` gana para la notación y reglas de **casos de uso**.
- Release 1 no es el tag `1.0.0` del MVP.
- Sin paquetes nuevos (ni cmdk, ni headless-ui, ni kit de iconos).

## Criterios de aceptación

- [x] Ciclo nombrado **Release 1**; línea de producto **2.0**.
- [x] W14-02 deja de ser exclusión; FR-R01 biblioteca (ADR-007).
- [x] FR-R02 selector combobox + búsqueda, chrome.
- [x] W17-14 secuencia in-scope; `sequence-model.md` cita UML 2.5.1.
- [x] W17-13 clases sigue bloqueada; no es el primer tipo extra.
- [x] FR-P07 in-scope, acoplado a W17-14; host vacío sigue prohibido.
- [x] Envelope 2.x nombrado; `arkuml-usecase-json` no se reutiliza.
- [x] Solo esta wave tiene TASK-046–050; cada una pasa el template.
- [x] Índice y `docs/tasks/README.md` apuntan al próximo contrato (046).
- [x] `src/` intacto.

## Tests

Glob `docs/tasks/**/TASK-*.md`: IDs únicos, enlaces rotos ausentes.

## Comandos de verificación

```bash
git diff --check
```

No hay código. No reformatear chrome ajeno.

## Stop conditions

- Se pide metamodelo de secuencia sin fuente (aquí la fuente está citada).
- Se pide IndexedDB, clases, fragmentos o un host vacío «por si acaso».
- Se pide TASK para toda la fase 12–17.

## Definition of Done

Release 1 congelado; TASK-046+ existen solo donde el contrato es
ejecutable. Sin implementación de producto.

## Evidencia de cierre

2026-09-14. Criterios `[x]`. Wave **Release 1 — Biblioteca local y
diagrama de secuencia (schema 2)**.

Decisiones cerradas:

- Nombre de ciclo **Release 1**; SemVer de producto **2.0.0** en el
  primer tag de esta línea. No es el `1.0.0` del MVP.
- Selector = biblioteca (W14-02), no un reemplazo de kind. ADR-007.
- Primer `document.kind` extra = **secuencia** (W17-14), no clases.
- Subconjunto UML: lifeline + `synchCall` + `reply` (UML 2.5.1 §17).
- `schemaVersion` 2 + `storageVersion` 2 en un solo freeze; `migrate()`
  `1→2` antes del primer save.
- Envelope público 2.x: `arkuml-document-json` / `formatVersion` 2.
- Combobox propio (tokens, CSS modules); sin `<select>` nativo ni
  paquetes.
- W17-13, IndexedDB, sync, temas, PDF, Generalization: fuera.

Hijos:

- [`12-uml/TASK-046.md`](../12-uml/TASK-046.md) — dominio schema 2.
- [`14-persistence/TASK-047.md`](../14-persistence/TASK-047.md) — biblioteca.
- [`13-editor/TASK-048.md`](../13-editor/TASK-048.md) — combobox + búsqueda.
- [`13-editor/TASK-049.md`](../13-editor/TASK-049.md) — módulo secuencia.
- [`14-persistence/TASK-050.md`](../14-persistence/TASK-050.md) — archivo 2.x.

Comandos realmente corridos:

```bash
git diff --check
```

`git diff --check`: OK (avisos CRLF de Git en Windows, sin conflictos de
marcadores). Glob `docs/tasks/**/TASK-*.md`: 50 archivos, IDs 001–050
únicos. `src/` intacto. Sin `16-a11y/`.
