# TASK-030: Gate de salida de la remediación

## Estado documental

Hecha

## Objetivo

Decidir si el RC es honesto y reproducible: evidencias 026–029 cerradas,
limitaciones publicadas y Post-MVP aún no empezado.

## Prioridad

P0

## Dependencias

TASK-026, TASK-027, TASK-028, TASK-029

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/tasks/post-024/README.md
- @docs/tasks/post-024/risk-register.md
- @docs/tasks/post-024/roadmap.md
- @README.md
- @docs/tasks/post-024/10-release/TASK-026.md
- @docs/tasks/post-024/10-release/TASK-027.md
- @docs/tasks/post-024/10-release/TASK-028.md
- @docs/tasks/post-024/10-release/TASK-029.md

## Estado inicial

La fase 10 reparte firma RC, licencia, docs y medidas. Nada de eso autoriza
Generalization, IndexedDB, PDF ni temas. El roadmap sigue en estado catálogo.

## Dentro del alcance

- Verificar que 026–029 están `Hecha` (o `Bloqueada` con dueño y sin fingir
  verde).
- Comprobar que ningún R/P/A de severidad alta queda sin disposición.
- Confirmar CI (`check`, E2E acordado, audit) según la política Playwright
  reconciliada.
- Publicar en README/mvp-spec: ship / no ship y por qué (fase 9, checklist,
  licencia).
- Desbloquear explícitamente TASK-031 o dejar Post-MVP `Bloqueada`.
- Actualizar el índice.

## Fuera del alcance

- Escribir `post-mvp-spec.md` (TASK-031).
- Crear TASK-034+ o carpetas 12–17.
- Implementar producto.

## Archivos / módulos afectados

- `README.md`
- `docs/product/mvp-spec.md` (solo clasificación ship / fase 9 si 028 no la
  cerró)
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/risk-register.md`
- `docs/tasks/post-024/10-release/TASK-030.md`

## Cambios esperados

Un extraño puede saber: «este zip es el RC, con estas limitaciones, bajo esta
licencia (o sin claim Open Source), y el Post-MVP no está a medias».

## Restricciones

- No medio-implementar Post-MVP (regla TASK-020).
- No reabrir ADRs aquí.
- Dependencias 026–029 son reales: no cerrar 030 con 026 abierta.

## Criterios de aceptación

- [x] 026–029 `Hecha` o `Bloqueada` documentada (nunca silenciosa).
- [x] Hallazgos alta severidad del registro tienen disposición.
- [x] README describe RC, limitaciones y licencia/silencio de forma
      consistente.
- [x] TASK-031 queda `Lista` solo si este gate es `Hecha`.
- [x] Índice actualizado.

## Tests

Revisión del índice y del registro. `npm run check` si el árbol de producto
no está sucio por otras TASK.

## Comandos de verificación

```bash
npm run check
```

## Stop conditions

- Una dependencia sigue `En curso` o `Lista` sin evidencia.
- Se pide «aprobar el RC» y a la vez empezar Generalization en el mismo chat.

## Definition of Done

Fase 10 cerrada; gobernanza Post-MVP habilitada o explícitamente aplazada.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. **Ship.** El RC es honesto y reproducible. El
Post-MVP no está empezado (roadmap en catálogo; TASK-031 `Lista` y
desbloqueada, no ejecutada).

Dependencias:

- TASK-026 `Hecha`: checklist RC post-identidad; Chrome 152 preview;
  Playwright Chromium/Firefox/WebKit; Safari nativo → WebKit en Windows.
- TASK-027 `Hecha`: Apache-2.0; `LICENSE` versionada; copy Open Source
  alineado.
- TASK-028 `Hecha`: A-01–A-12 dispuestas; ADR-005 CI=`preview`; fase 9 no
  bloqueó el RC de 020 y sí exigía 024 para este gate (024 hecha).
- TASK-029 `Hecha`: 100/150 cumple NFR-03/04; 200/300 2x no cabe (1x
  3280 ms); JSON ~95 KiB UTF-16; dominio 97.56 %/96.69 %; markers Safari
  aceptados.

Alta severidad con disposición (ninguna silenciosa): R-01, R-02, R-03,
R-04, R-05, R-10, R-11; P-01, P-02, P-03, P-05, P-09, P-10, P-12; A-01,
A-02, A-04, A-09. A-02 cierra aquí: ship.

CI (política ADR-005): `check` + `npm audit --audit-level=high` en Ubuntu;
E2E en `windows-latest` con `CI=true` → `vite preview` `:5173`; Firefox y
WebKit `@smoke|@export-spike`. Runner intacto.

Comandos realmente corridos:

```bash
npm run check
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --audit-level=high
```

`npm run check` falla en `format:check` por 10 archivos de chrome/tooltips
de TASK-024 (mismos que 028/029). Esta TASK no los reformateó. Lint,
typecheck, 258 tests y `vite build` OK. `npm audit --audit-level=high`:
0 vulnerabilidades. E2E no se re-corrió: 026 y 029 ya firmaron; la política
en `playwright.config.ts` coincide con CI.

Sin `post-mvp-spec.md`, sin TASK-034+, sin producto nuevo. ADRs no
reabiertos.
