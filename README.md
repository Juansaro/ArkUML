# ArkUML

Editor web de diagramas UML. El MVP cubre únicamente **diagramas de casos de uso**, con edición visual, undo/redo, persistencia local y exportación a PNG/JPG.

## Requisitos

- Node.js `>=24.15 <25` (LTS). `.nvmrc` fija la major `24`.
- npm, con `package-lock.json` versionado.
- Navegadores: Chrome/Edge actuales, Firefox actual, Safari `>=16.4`.

## Exportación

PNG (transparencia) y JPG (fondo blanco, calidad 0.92) a 1x o 2x. El archivo cubre el diagrama completo, no el viewport recortado. Techo: 4096 px por lado y 16 megapíxeles; si 2x no cabe, usar 1x.

Safari/WebKit puede omitir de forma intermitente los `marker-end` SVG (flechas de include/extend). El resto del diagrama se rasteriza. Detalle en [rendering-and-export.md](docs/architecture/rendering-and-export.md).

## Scripts

| Script                  | Descripción                                     |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo Vite                     |
| `npm run build`         | Typecheck (`tsc -b`) y bundle de producción     |
| `npm run preview`       | Sirve el build de producción                    |
| `npm run typecheck`     | Typecheck sin emitir (`tsc -b --noEmit`)        |
| `npm run lint`          | ESLint (flat config, reglas tipadas)            |
| `npm run format:check`  | Prettier 3.9.6 en modo check                    |
| `npm run test`          | Tests unitarios / integration (Vitest + jsdom)  |
| `npm run test:coverage` | Unitarios con cobertura v8                      |
| `npm run test:e2e`      | Playwright (usar `--project=chromium` en local) |
| `npm run check`         | format → lint → typecheck → unit → build        |

`npm run check` no incluye E2E. La primera vez, instalar el navegador de Playwright:

```bash
npm ci
npx playwright install chromium
npm run check
npm run test:e2e -- --project=chromium
```

## Estado

| Área                          | Estado                                                        |
| ----------------------------- | ------------------------------------------------------------- |
| Documentación y ADRs          | Completa                                                      |
| Código de aplicación          | Scaffold Vite + React + TypeScript (TASK-001)                 |
| Calidad / tests               | ESLint, Prettier, Vitest y smoke E2E Chromium (TASK-002)      |
| Dependencias / `package.json` | Vite, React, TypeScript, ESLint, Prettier, Vitest, Playwright |

## Stack cerrado

Versiones de referencia verificadas el 2026-09-07. El detalle y las alternativas están en los ADRs.

| Área             | Decisión                                    |
| ---------------- | ------------------------------------------- |
| Runtime          | Node.js `>=24.15 <25`                       |
| Build / UI       | Vite 8.2 + React 19.2                       |
| Lenguaje         | TypeScript 6.0.3, `strict`                  |
| Motor gráfico    | `@xyflow/react` 12 (React Flow)             |
| Estado           | Zustand 5                                   |
| Validación       | Zod 4                                       |
| Persistencia MVP | LocalStorage detrás de `DiagramRepository`  |
| Exportación      | `html-to-image@1.11.11` → `canvas.toBlob()` |
| Tests            | Vitest + Testing Library + Playwright       |
| Estilos          | CSS Modules + custom properties             |

## Orden de lectura

1. [Especificación del MVP](docs/product/mvp-spec.md)
2. [Arquitectura](docs/architecture/architecture.md)
3. [Modelo de dominio](docs/architecture/domain-model.md)
4. [Rendering y exportación](docs/architecture/rendering-and-export.md)
5. [Estrategia de testing](docs/architecture/testing-strategy.md)
6. [ADRs](docs/decisions/README.md)
7. [Workflow para agentes](docs/development/agent-workflow.md)
8. [Backlog](docs/tasks/README.md)

Las reglas de Cursor viven en [`.cursor/rules/`](.cursor/rules/). No hay `AGENTS.md`: las Project Rules cubren el mismo rol sin duplicar instrucciones.

## Implementación

Un chat, una tarea. Adjuntar la tarea activa y los documentos que ella misma cita.

```text
TASK-001 → TASK-002 → … → TASK-020
```
