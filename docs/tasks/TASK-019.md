# TASK-019: Presupuesto de rendimiento y optimización

## Objetivo

Medir el escenario 100 elementos / 150 relaciones y optimizar **solo** cuellos demostrados.

## Prioridad

P0

## Dependencias

TASK-018

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/architecture.md
- @docs/decisions/ADR-002-diagram-engine.md

## Estado inicial

Editor completo funcionalmente.

## Dentro del alcance

- Fixture determinista 100/150. Estrés 200/300: smoke de usabilidad (restore y drag sin crash); no exige export 2x ni p95 de spec.
- Medir drag/pan/zoom, restore, autosave commit, export 2x.
- Memoizar nodeTypes/edgeTypes/nodos/callbacks; selectores de selección separados.
- Quitar listeners por nodo y estilos caros si el perfil los señala.
- Registrar resultados (máquina, navegador, números) en `docs/architecture/performance.md` **nuevo y breve**, o sección en testing-strategy si es un párrafo. Preferir `docs/architecture/performance.md` porque los números no pertenecen a la spec de producto.

## Fuera del alcance

- Virtualización, Canvas, WebGL sin incumplimiento medido.
- Debounce del feedback visual de drag.
- Umbrales de CI frágiles en máquinas heterogéneas (solo smoke amplio).

## Archivos / módulos afectados

- `e2e/performance.spec.ts` o `scripts/perf`
- componentes/adapters según perfil
- `docs/architecture/performance.md`

## Cambios esperados

Objetivos de spec: p95 frame <=33 ms en referencia; click <=100 ms; restore <=1 s; export 2x <=3 s en el escenario 100/150. Estrés 200/300: usable (sin crash); puede ser más lento. Export 2x de 200/300 no es criterio de esta TASK.

Si no se cumplen: documentar desviación y mitigación; no cambiar de motor sin ADR.

## Restricciones

Optimizaciones justificadas por perfil, no por moda.

## Criterios de aceptación

- [ ] Resultados versionados con hardware/navegador.
- [ ] Suite funcional sigue verde.
- [ ] Estrés 200/300 usable (restore y drag sin crash; puede ser más lento). Export 2x de 200/300 queda fuera (TASK-029).

## Tests

Perf smoke tolerante. Perfil manual Chrome. Regresión E2E.

## Comandos de verificación

```bash
npm run test:e2e -- --grep @perf
npm run test:e2e -- --project=chromium
npm run check
```

## Stop conditions

- Reescritura a Konva sin números.

## Definition of Done

Riesgos restantes listados en performance.md.
