# TASK-029: Evidencia técnica de riesgos conocidos

## Estado documental

Hecha

## Objetivo

Medir o aceptar explícitamente los riesgos de export, storage, cobertura y
markers Safari, con números versionados.

## Prioridad

P1

## Dependencias

TASK-025

## Contexto obligatorio

- @docs/architecture/performance.md
- @docs/architecture/testing-strategy.md
- @docs/architecture/rendering-and-export.md
- @docs/decisions/ADR-003-state-management.md
- @docs/decisions/ADR-004-persistence.md
- @docs/decisions/ADR-006-export.md
- @docs/product/mvp-spec.md (NFR-03, NFR-04)
- @docs/tasks/TASK-019.md
- @docs/tasks/post-024/risk-register.md
- @docs/tasks/post-024/README.md

## Estado inicial

`performance.md` mide 100/150 y deja export 2x en 200/300 **sin** número.
ADR-003/004 pedían tamaño de historial/JSON; no está publicado. La cobertura
de dominio (≥90 % líneas / ≥85 % ramas) es un objetivo sin cifra en docs.
Safari puede omitir `marker-end` de forma intermitente; la degradación está
narrada, no reabrió ADR-006. `interactionWidth` 24 px puede tapar nodos en
automatización. Los umbrales `@perf` de CI no son SLO.

## Dentro del alcance

- Medir export PNG 2x en fixture de estrés 200/300 (o documentar por qué no
  cabe en techo 4096/16 MP y degradar a 1x con evidencia).
- Publicar tamaño aproximado del JSON/snapshot del escenario objetivo y si se
  acerca a 1 MiB / cuota.
- Publicar cobertura de `src/domain` (líneas y ramas) o corregir el objetivo
  si ya no se persigue.
- Dejar por escrito: (a) markers WebKit aceptados como limitación de producto
  o (b) stop para reabrir ADR-006 (sin implementar el nuevo export aquí).
- Aclarar que los umbrales CI de perf no son SLO; apuntar a `performance.md`.
- Nota sobre `interactionWidth` vs Playwright vs ratón real.
- Actualizar risk-register (R-01, R-02, R-03, R-05, R-08, R-15, P-06–P-08) e
  índice.

## Fuera del alcance

- Virtualización, X6, Konva, IndexedDB, PDF, SVG.
- Cambiar pins (`html-to-image@1.11.11`) salvo stop + ADR.
- Firmar el checklist UX (TASK-026).
- Reescribir el canvas.

## Archivos / módulos afectados

- `docs/architecture/performance.md`
- `docs/architecture/rendering-and-export.md` (cláusula WebKit en pasado)
- `docs/architecture/testing-strategy.md` (cobertura, si se publica)
- `README.md` (limitaciones, si cambian)
- `docs/tasks/post-024/risk-register.md`
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/10-release/TASK-029.md`
- opcional: `e2e/performance.spec.ts` / fixtures si hace falta una medida
  reproducible

## Cambios esperados

NFR y riesgos dejan de ser «se medirá en TASK-019» sin cifra, o quedan
aceptados con fecha y máquina.

## Restricciones

- Máquina de referencia: la documentada en TASK-019/`performance.md`.
- No fingir números. Si no se mide, el hallazgo queda `Bloqueada` o
  «aceptado sin medida» explícito (no es silencio).
- No ampliar el escenario objetivo del MVP.

## Criterios de aceptación

- [x] Export 2x 200/300 tiene número, degradación 1x justificada, o
      aceptación explícita de no medir.
- [x] Tamaño JSON/snapshot del objetivo publicado o aceptado como desconocido
      con dueño.
- [x] Cobertura de dominio publicada o el objetivo retirado/ajustado.
- [x] Markers Safari: limitación de producto **o** ADR-006 reabierto (sin
      implementar).
- [x] CI perf ≠ SLO, escrito.
- [x] Índice y risk-register actualizados.

## Tests

Correr el job/spec de perf que se use para los números. No borrar tests para
obtener verde.

## Comandos de verificación

```bash
npm run test:coverage -- src/domain
npm run test:e2e -- --project=chromium --grep "@perf|export"
npm run format:check
```

Ajustar el grep al spec real. Documentar el comando exacto en la evidencia.

## Stop conditions

- Hace falta cambiar el motor gráfico o el pin de html-to-image.
- Los números incumplen NFR-03/04 en 100/150: no implementar Konva aquí;
  registrar contingencia (roadmap C-PERF).

## Definition of Done

Riesgos técnicos con cifra o aceptación fechada; sin features nuevas.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. Máquina de referencia: Windows 11 25H2, Ryzen 7
7800X3D, 32 GB, Playwright 1.63 Chromium (igual que TASK-019).

Comandos realmente corridos:

```bash
npx vitest run src/test/performanceFixture.test.ts
npx vitest run --coverage --coverage.include=src/domain/**
npm run test:coverage -- src/domain
npx playwright test --project=chromium --workers=1 e2e/performance.spec.ts
npx prettier --check e2e/performance.spec.ts src/test/performanceFixture.test.ts
```

`npm run format:check` (repo entero) falla en 10 archivos de chrome/tooltips
**fuera** de esta TASK; no se reformatearon (scope). Los archivos tocados
aquí pasan Prettier.

El grep de la TASK (`@perf|export`) se ajustó al spec de números:
`e2e/performance.spec.ts` con `--workers=1`. El smoke paralelo
(`npm run test:e2e -- --grep @perf --project=chromium`) no es SLO.

Hallazgos:

- 100/150 aislado: restore 397 ms, click 22 ms, drag p95 17 ms, PNG 2x
  1915 ms. NFR-03/04 cumplen. No se activa C-PERF.
- 200/300 PNG 2x: `4864 × 6496` (31.6 MP) supera 4096/16 MP. UI sugiere 1x.
  PNG 1x `2432 × 3248` en 3280 ms.
- Snapshot 100/150: 48646 B UTF-8 / ~95 KiB UTF-16; 200/300 ~191 KiB UTF-16.
  Lejos de 1 MiB / cuota ~5 MiB. Historial 100× no se persiste.
- `src/domain` (suite unitaria, `--coverage.include=src/domain/**`): 97.56 %
  líneas / 96.69 % ramas. Objetivo `>=90 / >=85` se mantiene.
- Markers Safari/WebKit: limitación de producto aceptada; ADR-006 no
  reabierto. Pin `html-to-image@1.11.11` intacto.
- CI `@perf` ≠ SLO: escrito en `performance.md`.
- `interactionWidth` 24 px: Playwright vs ratón real, escrito.

Índice post-024 → `Hecha`. R-01, R-02, R-03, R-05, R-08, R-15, P-06–P-08
dispuestos. Sin features nuevas.
