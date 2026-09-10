# TASK-041: Runbook de publicación estática

## Estado documental

Lista

## Objetivo

Publicar un runbook para servir el `dist/` de ArkUML en un host estático
sin secrets cloud, sin convertir el producto en SaaS.

## Prioridad

P1

## Dependencias

TASK-037

## Contexto obligatorio

- @docs/product/post-mvp-spec.md
- @docs/product/mvp-spec.md
- @docs/tasks/TASK-020.md
- @README.md
- @docs/decisions/ADR-001-frontend-stack.md
- @LICENSE

## Estado inicial

Wave 2 congelada: este archivo es W17-05 / FR-P06. El `base` de Vite es
`./`. El README ya explica `npm run build` + `vite preview` y que no se
abra `file://`. TASK-020 dejó el hosting de **proveedor** fuera de alcance.
No hay `docs/operations/`. Apache-2.0.

## Dentro del alcance

- Crear [`docs/operations/static-hosting.md`](../../../operations/static-hosting.md)
  como runbook canónico.
- Contenido mínimo:
  - Prerrequisitos: Node `>=24.15 <25`, `npm ci`, `npm run build`.
  - Qué se publica: el contenido de `dist/` (una sola página; no hace
    falta fallback de router).
  - `base` `./`: vale la raíz de un sitio o una subcarpeta, siempre que
    los assets viajen junto al `index.html`.
  - HTTP obligatorio (`file://` no sirve).
  - Recetas **ilustrativas** (comandos locales o «arrastrar `dist/`»):
    nginx (root + `index.html`), GitHub Pages (publicar `dist/` sin
    Action con secrets), Netlify Drop / carpeta estática. No crear
    cuentas ni pipelines en este repo.
  - Cache: `index.html` corto; assets hasheados de Vite pueden ser
    inmutables.
  - Licencia: el `dist/` lleva dependencias MIT; el código es Apache-2.0;
    no omitir `LICENSE`.
  - Explicitamente **no**: backend, env de API, analytics, PWA, headers
    de auth, secrets de CI.
- El README conserva el procedimiento corto de preview y enlaza el
  runbook (no duplicar las recetas de proveedor).
- Enlazar desde `docs/architecture/architecture.md` (lista de docs
  canónicos) si esa lista se toca; si no, basta el README.

## Fuera del alcance

- Workflow de deploy, tokens, DNS, dominio, Cloudflare/Vercel con
  cuenta del proyecto.
- PWA, Service Worker, SaaS, analytics (W17-02/04/10).
- Cambiar `base` de Vite, pines o CI.
- Código de `src/`.

## Archivos / módulos afectados

- `docs/operations/static-hosting.md` (nuevo)
- `README.md` (enlace; no reescribir el RC)
- `docs/architecture/architecture.md` (puntero opcional)
- `docs/tasks/post-024/17-ecosystem/TASK-041.md`
- `docs/tasks/post-024/README.md` (estado/evidencia)

## Cambios esperados

Un operador puede publicar `dist/` en un host estático siguiendo el
runbook, sin secrets en el repositorio.

## Restricciones

- No añadir secrets ni archivos `.env`.
- No afirmar que un proveedor concreto está «soportado» como producto.
- `mvp-spec.md` no gana hosting cloud.

## Criterios de aceptación

- [ ] Existe `docs/operations/static-hosting.md` con build, `base` `./`,
      HTTP vs `file://`, y al menos dos recetas estáticas.
- [ ] El runbook prohíbe secrets, backend, analytics y PWA.
- [ ] README enlaza el runbook y conserva `vite preview`.
- [ ] Ningún workflow de deploy ni cambio de `src/`.
- [ ] `LICENSE` Apache-2.0 sigue siendo la referencia legal.

## Tests

Revisión documental y enlaces relativos. No hay suite de producto.

## Comandos de verificación

```bash
git diff --check
```

No reformatear los archivos de chrome/tooltips de TASK-024.

## Stop conditions

- Se pide Action de deploy con `GITHUB_TOKEN` de pages o un secret.
- Se pide PWA, dominio o backend «para publicar».
- Se pide cambiar el `base` de Vite a un path absoluto de un host.

## Definition of Done

FR-P06 publicado; producto y CI intactos; criterios `[x]` con evidencia.

## Evidencia de cierre

Pendiente.
