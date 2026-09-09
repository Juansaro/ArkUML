# TASK-020: CI, auditoría de alcance y release candidate

## Objetivo

Producir un RC estático reproducible, auditado y sin features ocultas fuera del MVP.

## Prioridad

P0

## Dependencias

TASK-019

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/testing-strategy.md
- @docs/development/agent-workflow.md
- @docs/decisions/ADR-001-frontend-stack.md

## Estado inicial

App completa en local.

## Dentro del alcance

- `.github/workflows/ci.yml`: `npm ci`, `npm run check`, Playwright Chromium, smokes cross-browser. Cache npm/browsers con cautela.
- Auditoría `npm audit --audit-level=high` y revisión de licencias (MIT/MPL de axe).
- Eliminar código demo, todos, features post-MVP a medias.
- Checklist manual UX / export / a11y / browsers.
- README: cómo servir `dist/` como SPA estática.
- Registro de limitaciones conocidas (README o mvp-spec).

## Fuera del alcance

- Hosting, dominio, analytics, backend, secrets.
- Husky/commitlint.
- Ampliar alcance.

## Archivos / módulos afectados

- `.github/workflows/ci.yml`
- `README.md`, docs si hay limitaciones nuevas
- limpieza de `src/` / `e2e/`

## Cambios esperados

CI verde desde checkout limpio. `dist/` funciona con `vite preview` o similar.

## Restricciones

No configurar proveedor cloud.

## Criterios de aceptación

- [ ] CI pasa.
- [ ] High/critical de audit resueltos o ADR de excepción.
- [ ] El RC de esta TASK cubre P0 001–020 y los P1 que el MVP exigía entonces (012, 017). No afirma que 021–024 ni el [árbol post-024](post-024/README.md) estén cerrados. Post-MVP no está medio implementado.
- [ ] Base path de Vite correcto para hosting estático simple.

## Tests

Suite completa. Checklist manual. npm audit.

## Comandos de verificación

```bash
npm ci
npm run check
npm run test:e2e
npm audit --audit-level=high
```

## Stop conditions

- Añadir PDF/auth «ya que estamos».

## Definition of Done

CI verde. Documentación del RC coherente con el alcance **de esta TASK**. El backlog P1 posterior (021–024) y el árbol post-024 viven fuera de este criterio; no se dan por hechos aquí. Handoff: limitaciones y siguientes pasos post-MVP (generalization, IndexedDB, otros diagramas) **sin implementarlos**.
