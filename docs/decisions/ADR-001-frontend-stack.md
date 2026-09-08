# ADR-001: Frontend y toolchain de build

## Context

ArkUML es una SPA estática de editor gráfico. No hay SEO, autenticación ni backend en el MVP. El stack debe ser reproducible en Windows, amigable para agentes y compatible con un pipeline de tests (Vitest + Playwright).

Versiones verificadas el 2026-09-07 (npm): Vite `8.2.2`, React `19.2.8`, TypeScript `7.0.2` (latest) y `6.0.3` (línea 6), `@vitejs/plugin-react` `6.1.1`, ESLint `10.10.0`, `typescript-eslint` `8.70.0`, Prettier `3.9.6`.

Hechos: Vite 8 requiere Node `20.19+` o `22.12+`. Vitest 5 requiere Node `>=22.12`. jsdom 30 requiere Node `^22.22.2`, `^24.15.0` o `>=26`. `typescript-eslint` 8.70 declara peer `typescript: >=4.8.4 <6.1.0`.

## Problem

Elegir runtime, bundler, UI library, lenguaje y calidad de código sin arrastrar SSR, incompatibilidades de TypeScript 7 ni ganchos Git prematuros.

## Options

1. Vite + React + TypeScript 6.0.3 + ESLint/Prettier; Node 24.15+.
2. Vite + React + TypeScript 7.
3. Next.js (App Router o SPA export).
4. Svelte 5 + Vite.
5. Jest + webpack u otro bundler clásico.

## Decision

Opción 1.

- Node.js `>=24.15 <25` (LTS), `.nvmrc` = `24`.
- Vite 8.2 + `@vitejs/plugin-react`.
- React 19.2.
- TypeScript **6.0.3** con `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`.
- ESLint 10 + typescript-eslint 8, flat config, reglas recomendadas tipadas.
- Prettier **3.9.6 fijado exactamente**.
- npm + `package-lock.json`.
- CSS Modules + custom properties. Sin Tailwind ni shadcn en el MVP.
- Sin Husky, lint-staged ni commitlint en el MVP. Conventional Commits se documentan como convención, no como hook.

## Rationale

La app es un editor cliente. Vite produce un bundle estático sin el coste conceptual de Next (SSR, routing por archivos, restricciones de static export). React es el ecosistema de React Flow. TypeScript 7 es estable como compilador nativo, pero typescript-eslint **no** lo soporta (peer `<6.1.0`; issues de soporte cerrados como not planned hasta API 7.1). Forzar TS7 rompería lint, que es crítico para agentes.

Node 24.15+ es el mínimo que cubre jsdom 30 y Vitest 5 a la vez; 22.12 no basta.

Prettier exacto evita diffs de formato entre máquinas. CSS Modules evitan una dependencia de diseño que no aporta al núcleo gráfico.

## Consequences

- El MVP no se beneficia aún de la velocidad de `tsc` nativo de TS7.
- Hay que fijar `engines` y documentar Node 24; CI usará la misma major.
- Migración a TS7 queda explícitamente post-MVP, cuando typescript-eslint declare soporte (previsto en torno a TS 7.1 / API programática).
- Sin hooks Git, la calidad se garantiza con `npm run check` y CI (TASK-020).

## Rejected alternatives

- **TypeScript 7 ahora:** lint y typed-lint no funcionan de forma soportada. Alias dual TS6/TS7 es sobreingeniería para un repo vacío.
- **Next.js:** no hay SEO ni SSR; añade convenciones que un agente puede malinterpretar.
- **Svelte:** válido con Vite, pero abandona el ecosistema de React Flow sin ganancia para este MVP.
- **Tailwind/shadcn:** más contexto y dependencias; React Flow UI asume Tailwind 4 si se usa su kit, cosa que no necesitamos.
- **Husky/lint-staged:** fricción en Windows y en agentes; no sustituyen CI.
