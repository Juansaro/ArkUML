# TASK-032: Política de evolución de schema y storage

## Estado documental

Hecha

## Objetivo

Definir cómo evoluciona el documento persistido y qué ADRs hay que reabrir
antes de cualquier persistencia Post-MVP.

## Prioridad

P0

## Dependencias

TASK-031

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/tasks/post-024/11-governance/TASK-031.md
- @docs/decisions/ADR-003-state-management.md
- @docs/decisions/ADR-004-persistence.md
- @docs/architecture/architecture.md
- @docs/architecture/domain-model.md
- @docs/tasks/post-024/roadmap.md
- @docs/tasks/post-024/README.md

## Estado inicial

Schema `1`, un `arkuml-workspace-v1` en localStorage, historial acotado,
sin migraciones, sin multi-documento, sin import JSON. ADR-004,
`architecture.md` y `domain-model.md` son la verdad del MVP. El roadmap
fase 14 lista IndexedDB, multi-doc, sync multi-tab e import/export como
propuestas.

El artefacto de TASK-031 (`docs/product/post-mvp-spec.md` o el path que
esa TASK fije) debe existir al empezar; no hay spec Post-MVP en el árbol
hasta que 031 cierre.

## Dentro del alcance

- Escribir `docs/architecture/schema-evolution.md` (o sección canónica
  equivalente) con: bump de `schemaVersion`, qué es breaking, orden de
  migraciones, rechazo de documentos desconocidos, y qué pasa con
  localStorage lleno.
- Decidir **qué ADR se reabre** (004 como mínimo si hay IndexedDB o
  multi-doc; 003 si el historial deja de ser RAM-only; ninguno si el
  Post-MVP no toca persistencia en la primera wave).
- No implementar migraciones ni cambiar el schema del MVP.
- Actualizar roadmap (fase 14) e índice.

## Fuera del alcance

- Código de IndexedDB, sync, import/export.
- Reabrir ADR-006 (export de imagen).
- Crear TASK-034+ (TASK-033).

## Archivos / módulos afectados

- `docs/architecture/schema-evolution.md` (nuevo, o el path que 031 fije)
- `docs/decisions/README.md` (puntero a reaperturas **futuras**, no el ADR
  nuevo todavía)
- `docs/tasks/post-024/roadmap.md`
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/11-governance/TASK-032.md`

## Cambios esperados

Quien implemente persistencia Post-MVP sabe si debe abrir un ADR **antes**
de tocar `src/persistence`.

## Restricciones

- Schema `1` del MVP no cambia en esta TASK.
- No elegir IndexedDB «porque sí»: o la spec 031 lo pide, o queda
  `condicional`.
- `src/domain` no importa storage.

## Criterios de aceptación

- [x] Política de evolución escrita (versión, breaking, migraciones,
      rechazo).
- [x] Lista explícita: ADR a reabrir / no reabrir, con motivo.
- [x] Fase 14 del roadmap alineada (autorizada, condicional o aplazada).
- [x] Índice actualizado.

## Tests

Revisión documental.

## Comandos de verificación

```bash
npm run format:check
git diff --check
```

## Stop conditions

- Se pide migrar el schema del MVP en el mismo chat.
- 031 no definió si hay multi-documento.

## Definition of Done

Reglas de persistencia futura publicadas; código de storage intacto.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. Política publicada en
`docs/architecture/schema-evolution.md`. Schema `1` intacto. Sin
migraciones en código. `src/persistence` sin cambios. Ningún ADR
reabierto.

Decisiones:

- Schema `1` cerrado: `strictObject`; un campo persistido nuevo es 2.0,
  no minor 1.x.
- IndexedDB no elegido; W14-01 condicional C-QUOTA. Reabrir ADR-004
  **antes** de código si C-QUOTA dispara.
- Multi-documento: exclusión; esta TASK no diseña lista/switch.
- FR-P03: envelope `arkuml-usecase-json` / `formatVersion` 1, payload
  schema `1`. No reabre ADR-004.
- `migrate()`: política (orden, rechazo, confirmación); código solo con
  el primer bump.
- Primera wave (W12-01 + W13-02): ningún ADR. ADR-003 solo si el
  historial deja RAM-only. ADR-006 fuera de alcance.

Fase 14: W14-01 condicional; W14-02/05 exclusión; W14-03 y W14-04
autorizados en spec (envelope y política; sin código de migrate).

Desviación: `.gitignore` ignoraba `docs/` (commit 198da87, TASK-027).
Eso impedía versionar `schema-evolution.md`. Se quitó esa línea; no se
añadieron otros untracked.

Comandos realmente corridos:

```bash
npm run format:check
git diff --check
```

`git diff --check`: OK.
`npm run format:check`: falla en los mismos 10 archivos de chrome/tooltips
de TASK-024 que 028–031; esta TASK no los reformateó. Los markdown
nuevos o tocados no aparecen en el warn de Prettier.
