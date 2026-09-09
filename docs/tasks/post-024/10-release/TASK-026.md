# TASK-026: Re-signoff RC posterior a la identidad

## Estado documental

Lista

## Objetivo

Firmar de nuevo el checklist RC contra el producto **después** de TASK-024,
con evidencia humana y E2E relevante, sin añadir capacidades UML.

## Prioridad

P0

## Dependencias

TASK-024, TASK-025

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/testing-strategy.md
- @docs/product/brand-system.md
- @README.md (checklist manual RC y limitaciones)
- @docs/tasks/TASK-021.md
- @docs/tasks/TASK-024.md
- @docs/tasks/post-024/README.md

## Estado inicial

TASK-021 documenta gestos, visor PNG/JPG y smokes Firefox/Safari que el pase
MCP de TASK-020 no firmó. TASK-024 cambia chrome, iconos, tooltips, favicon y
baselines. El README declara RC; el gate de fase 8 pide checklist firmado. Los
nodos del lienzo no son clicables vía árbol a11y (limitación publicada).

## Dentro del alcance

- Recorrer el checklist README (arranque, UX, viewport, export, a11y, teclado,
  persistencia) en Chrome o Edge `>=1024×720` contra `npm run preview`.
- Firmar pan (Space+drag o botón medio), reparent y resize del boundary con
  ratón real o Playwright `--headed`.
- Abrir PNG 1x y JPG 1x en un visor del SO (transparencia vs fondo blanco).
- Smoke (arranque, un actor, export PNG, recarga) en Firefox actual y Safari
  `>=16.4`.
- Verificar nombres accesibles, drawers ~768–1023 px, aviso `<768` px y que
  tooltips de chrome no rompen teclado ni Escape de diálogos.
- Versionar en README o handoff: fecha, browsers, qué se pulsó, qué falló.
- Actualizar el índice post-024 a `Hecha` o `Bloqueada`.

## Fuera del alcance

- Implementar TASK-024 si aún no está hecha.
- SR del grafo React Flow, PDF, hosting, temas.
- Cambiar el job CI `windows-latest` ni rehacer el dominio.
- Reabrir ADR-006 salvo que un fallo nuevo de export lo exija (stop).

## Archivos / módulos afectados

- `README.md` (checklist / limitaciones / evidencia de firma)
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/10-release/TASK-026.md`
- opcional: `e2e/shell-layout.spec.ts`, `e2e/accessibility.spec.ts` si un
  locator estable se rompe por chrome

## Cambios esperados

El checklist deja de ser una lista sin dueño: hay fecha, browsers y resultado.
Las limitaciones de canvas, Safari markers y `<768` px siguen publicadas si
siguen siendo ciertas.

## Restricciones

- Chrome DevTools MCP no sustituye ratón real para pan/reparent/resize.
- Baselines visuales: Windows, Chromium, Segoe UI.
- No afirmar tests no corridos. No inventar copy de dominio.

## Criterios de aceptación

- [ ] Checklist RC recorrido y firmado (fecha, browsers, resultado).
- [ ] Pan, reparent y resize comprobados en preview.
- [ ] PNG 1x transparente y JPG 1x opaco blanco abiertos en visor.
- [ ] Smoke Firefox y Safari `>=16.4` sin pérdida al recargar.
- [ ] Huecos de TASK-021 cubiertos o desviación explícita.
- [ ] Índice post-024 actualizado.

## Tests

Playwright Chromium de shell/a11y si el chrome cambió. El valor principal es
el pase manual documentado.

## Comandos de verificación

```bash
npm run build
npm run preview
npm run test:e2e -- --project=chromium --grep "reparent|exportación|pan|a11y|shell"
```

## Stop conditions

- TASK-024 no tiene evidencia de cierre.
- Reescribir hit-testing del canvas «para que el agente clique nodos».
- Un fallo de export nuevo y material en un browser soportado (reabrir ADR-006).

## Definition of Done

Checklist firmado post-identidad; limitaciones honestas; índice actualizado.

## Evidencia de cierre

Pendiente. Re-signoff no ejecutado. Bloqueo de 2026-09-09 levantado el mismo
día: TASK-024 tiene criterios `[x]` y evidencia de comandos, baselines y
navegador. Reabrir este contrato desde `Lista`.
