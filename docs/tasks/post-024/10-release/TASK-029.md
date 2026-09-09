# TASK-029: Evidencia técnica de riesgos conocidos

## Estado documental

Lista

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

- [ ] Export 2x 200/300 tiene número, degradación 1x justificada, o
      aceptación explícita de no medir.
- [ ] Tamaño JSON/snapshot del objetivo publicado o aceptado como desconocido
      con dueño.
- [ ] Cobertura de dominio publicada o el objetivo retirado/ajustado.
- [ ] Markers Safari: limitación de producto **o** ADR-006 reabierto (sin
      implementar).
- [ ] CI perf ≠ SLO, escrito.
- [ ] Índice y risk-register actualizados.

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

Pendiente.
