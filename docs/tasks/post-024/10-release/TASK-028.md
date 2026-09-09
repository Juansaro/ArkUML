# TASK-028: Reconciliación documental del RC

## Estado documental

Hecha

## Objetivo

Dejar los contratos canónicos coherentes con el estado real del RC: qué está
hecho, qué sigue abierto, y qué es limitación publicada.

## Prioridad

P0

## Dependencias

TASK-025

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/architecture.md
- @docs/architecture/domain-model.md
- @docs/decisions/ADR-005-testing.md
- @docs/decisions/README.md
- @docs/development/agent-workflow.md
- @docs/tasks/README.md
- @docs/tasks/TASK-020.md
- @docs/tasks/post-024/risk-register.md
- @docs/tasks/post-024/README.md
- @README.md

## Estado inicial

La auditoría registró contradicciones: TASK-020 «P0 y P1 hechos» vs 021–024;
README «RC» vs checklist sin firma; ADR-005 `webServer` al **dev** vs CI
`vite preview`; architecture/workflow hablan de fase sin `src/` y listan hasta
TASK-022; `domain-model` warning de UseCase hijo más estricto que mvp-spec;
favicon absoluto vs `base: "./"`; TASK-019 200/300 opcional y obligatorio;
status idle «—» solo en README; gate del spike escrito en futuro.

Conversaciones pueden haber cerrado TASK-022/023 en código o docs; eso **no**
cuenta hasta evidencia versionada (criterios `[x]`, commit, o handoff en el
índice).

## Dentro del alcance

- Reescribir el criterio de TASK-020 para no afirmar que todo P1 futuro está
  hecho; apuntar al árbol post-024.
- Actualizar architecture (lista canónica, «esta fase no crea src/») y el
  párrafo de subagentes del workflow si sigue diciendo que no hay código.
- Enmendar ADR-005 **solo** si la decisión real es preview/dist; si se
  mantiene dev, alinear README/CI. No cambiar el runner.
- Resolver warnings: o mvp-spec adopta el caso «hijo fuera del padre», o
  domain-model se pliega a la spec.
- Favicon: contrato y `index.html`/brand-system en path compatible con
  `base: "./"` (relativo).
- Unificar el texto de TASK-019 sobre el fixture 200/300 (opcional vs CA).
- Documentar «—» en mvp-spec o retirarlo del README.
- Poner el spike/WebKit en pasado: degradación aceptada o ADR-006 reabierto
  (si se reabre, no implementar el export aquí).
- Registrar evidencia versionable de 022/023/024 o dejarlos abiertos.
- Decidir por escrito si la fase 9 bloquea ship (P-12) y dejarlo en mvp-spec
  o README.
- Actualizar el índice post-024.

## Fuera del alcance

- Implementar iconos, tooltips, UML nuevo o IndexedDB.
- Medir perf (TASK-029) o firmar el checklist (TASK-026).
- Elegir licencia (TASK-027).
- Promover Post-MVP a TASK-034+.

## Archivos / módulos afectados

- `docs/tasks/TASK-020.md`
- `docs/tasks/TASK-019.md` (solo la ambigüedad 200/300)
- `docs/architecture/architecture.md`
- `docs/architecture/domain-model.md` y/o `docs/product/mvp-spec.md`
- `docs/decisions/ADR-005-testing.md` y/o `README.md`
- `docs/decisions/README.md`
- `docs/development/agent-workflow.md` (párrafo de fase/código)
- `docs/product/brand-system.md` (href favicon si aplica)
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/risk-register.md` (marcar A-\* dispuestos)
- `docs/tasks/post-024/10-release/TASK-028.md`

## Cambios esperados

Un lector nuevo no ve «RC completo» y «P1 sin firmar» a la vez. Playwright
tiene una sola verdad. Architecture describe el repo con código.

## Restricciones

- `mvp-spec.md` y ADRs ganan. Cambiar un ADR es el objeto de **esta** TASK
  solo para ADR-005 (y README de decisions si el spike ya corrió).
- No pins nuevos. No código de editor salvo `index.html` si el favicon lo
  exige y TASK-024 aún no lo tocó.
- No marcar TASK-001–024 como hechas sin evidencia.

## Criterios de aceptación

- [x] TASK-020 ya no exige «todos los P1 del backlog hechos».
- [x] Architecture y workflow no afirman una fase sin código ni un techo
      TASK-022.
- [x] Una sola política Playwright (dev **o** preview) en ADR y README/CI.
- [x] Warnings geométricos: spec y domain-model coinciden.
- [x] Favicon compatible con `base: "./"`.
- [x] Fase 9: bloquea ship o no, escrito en un contrato canónico.
- [x] Evidencia 022/023/024 versionada o explícitamente pendiente.
- [x] Índice y risk-register actualizados.

## Tests

Revisión de enlaces y grep de frases stale («esta fase no crea», «P0 y P1 del
backlog hechos», `webServer`).

## Comandos de verificación

```bash
npm run format:check
git diff --check
```

## Stop conditions

- Hace falta cambiar el modelo persistido o reabrir ADR-006 «de paso».
- No hay dueño para la decisión fase 9 / Playwright / warnings.

## Definition of Done

Documentos canónicos alineados; contradicciones A-01–A-12 dispuestas o
bloqueadas con dueño.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. Decisiones: (1) Playwright CI/release = `vite
preview` de `dist/`; local = `dev` (ADR-005 enmendado, runner intacto);
(2) mvp-spec adopta warning «hijo fuera del padre» (coincide con
`collectWarnings`); (3) fase 9 no bloqueó el RC de TASK-020 y sí exige 024
para TASK-030 (024 ya hecha); (4) spike TASK-008 en pasado, degradación
WebKit aceptada, ADR-006 no reabierto. Evidencia 022/023/024: CAs `[x]` y
párrafo de cierre en cada TASK. Favicon `./favicon.svg` en contrato e
`index.html`.

Comandos: `npx prettier --check` sobre los archivos de esta TASK: OK.
`git diff --check`: OK (avisos CRLF de Git en Windows, sin whitespace error).
`npm run format:check` del repo: falla en 10 archivos de TASK-024
(`e2e/tooltips.spec.ts` y `src/editor/components/common/*`) ya presentes en
HEAD; esta TASK no los tocó.

Grep: no quedan «esta fase no crea», «P0 y P1 del backlog hechos», «Cuando
exista código», «Documentación completa» ni `href="/favicon.svg"` fuera del
hallazgo histórico del risk-register y de esta TASK.
