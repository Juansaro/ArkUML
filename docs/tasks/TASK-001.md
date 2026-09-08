# TASK-001: Scaffold SPA y entorno reproducible

## Objetivo

Obtener una SPA Vite + React + TypeScript mínima, con versiones compatibles y TypeScript estricto, sin motor gráfico todavía.

## Prioridad

P0

## Dependencias

Ninguna (la documentación de arquitectura ya existe en el repositorio).

## Contexto obligatorio

- @docs/decisions/ADR-001-frontend-stack.md
- @docs/architecture/architecture.md
- @docs/product/mvp-spec.md
- @.cursor/rules/00-core.mdc

## Estado inicial

Repositorio con docs, reglas y `.gitignore`. Sin `package.json` ni `src/`.

## Dentro del alcance

- Crear el scaffold Vite React TypeScript con npm.
- Fijar `engines.node` a `>=24.15 <25`, `.nvmrc` a `24`, package manager npm.
- Activar `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`.
- Scripts: `dev`, `build`, `preview`, `typecheck`.
- Pantalla mínima accesible que identifique «ArkUML» (landmark + heading).
- Actualizar README con requisitos de Node y scripts existentes.
- Versionar `package-lock.json`.

## Fuera del alcance

- React Flow, Zustand, Zod, html-to-image.
- Tailwind, shadcn, React Router, librería UI.
- ESLint/Prettier/Vitest/Playwright (TASK-002).
- TypeScript 7.
- Dominio UML.

## Archivos / módulos afectados

- `package.json`, `package-lock.json`, `.nvmrc`
- `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json` / `tsconfig.node.json` según scaffold
- `index.html`, `src/main.tsx`, `src/app/App.tsx` (o equivalente mínimo)
- `README.md`

## Cambios esperados

SPA que abre, typecheck y build verdes. Sin archivos demo del template (counter, logos Vite/React) en la UI final.

## Restricciones

- No usar TypeScript 7 ni `latest` sin lockfile.
- No introducir dependencias fuera de Vite/React/TS/plugin React.
- `src/domain` aún no existe.

## Criterios de aceptación

- [ ] La aplicación abre sin errores de consola.
- [ ] `npm run typecheck` y `npm run build` terminan 0.
- [ ] Node engines documentados; README actualizado.
- [ ] Identidad visible «ArkUML» con heading accesible.
- [ ] Lockfile versionado.

## Tests

Smoke manual en un navegador moderno. Aún no hay runner.

## Comandos de verificación

```bash
npm ci
npm run typecheck
npm run build
npm run dev
```

## Stop conditions

- El entorno no tiene Node 24.15+: documentar y no bajar el engines a 22.
- Se intenta instalar TypeScript 7 para «ir a latest».

## Definition of Done

Scaffold mínimo, README actualizado, sin dependencias fuera de alcance, comandos de typecheck/build ejecutados.
