# ArkUML

Editor web de diagramas UML. El MVP cubre únicamente **diagramas de casos de uso**, con edición visual, undo/redo, persistencia local y exportación a PNG/JPG.

Este repositorio es el **release candidate** estático del MVP: un único documento local, sin backend ni autenticación.

## Requisitos

- Node.js `>=24.15 <25` (LTS). `.nvmrc` fija la major `24`.
- npm, con `package-lock.json` versionado.
- Navegadores: Chrome/Edge actuales, Firefox actual, Safari `>=16.4`.

## Cómo servir `dist/` (SPA estática)

El `base` de Vite es `./`: los assets son relativos al `index.html`. Sirve la carpeta en la raíz de cualquier host estático simple (no hace falta un path de aplicación ni un fallback de router: hay una sola página).

```bash
npm ci
npm run build
npm run preview
```

`vite preview` escucha en `http://localhost:4173` por defecto. Cualquier servidor de archivos estáticos que sirva el contenido de `dist/` (por ejemplo el `index.html` en la raíz del sitio) también vale. No abras `dist/index.html` como `file://`: los módulos ES requieren HTTP.

CI usa el mismo bundle: `npm run build` y después Playwright contra `vite preview`.

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

En CI (`.github/workflows/ci.yml`): `npm ci`, `npm run check`, `npm audit --audit-level=high` en Ubuntu; suite Playwright (Chromium completo, smokes Firefox/WebKit) en `windows-latest` contra `dist/`.

## Limitaciones conocidas

Alcance canónico: [mvp-spec.md](docs/product/mvp-spec.md). Números de rendimiento: [performance.md](docs/architecture/performance.md).

- Un solo documento en `localStorage`. Sin cuentas, sync ni multi-archivo.
- Un `SystemBoundary` como máximo. Sin generalization, notas, extension points ni otros tipos UML.
- Pantalla objetivo `>=1024×720`. Entre 768 y 1023 px, paleta e inspector van en drawers. Por debajo de 768 px hay aviso; la edición no está soportada y el documento no se borra.
- Chrome de la aplicación orientado a WCAG 2.2 AA. El lienzo de React Flow no se recorre como documento equivalente para lector de pantalla; los handles son ratón-first. Axe cubre el chrome y excluye `.react-flow`. Chrome DevTools MCP no sustituye Playwright ni el ratón real para pan, reparent o resize: los nodos no son clicables vía árbol a11y.
- El status de un workspace vacío arranca en «—»; «Guardado» aparece tras autosave o restore.
- Safari/WebKit: las flechas de include/extend pueden faltar en el PNG/JPG de forma intermitente.
- Baselines visuales versionados en Windows (Segoe UI). No compararlos con capturas Linux.
- Sin virtualización del lienzo. El escenario 100/150 cumple presupuesto en la máquina de referencia; un perfil que lo incumpla se documenta antes de cambiar de motor.

## Checklist manual (RC)

Correr en Chrome o Edge actual, a `>=1024×720`, contra `npm run preview`. Repetir smokes (arranque, crear un actor, export PNG, recarga) en Firefox actual y Safari `>=16.4`. Pan (Space+drag o botón medio), reparent y resize del boundary requieren ratón real o Playwright `--headed`.

1. **Arranque:** abrir limpio; título, paleta, lienzo con boundary «Sistema», inspector y status «—». «Guardado» aparece tras autosave o restore.
2. **UX:** crear actor y caso de uso; association válida; include y extend; intento inválido muestra razón y no muta; mover, reparentar, redimensionar boundary, duplicar, borrar, undo/redo.
3. **Viewport:** zoom, pan, fit; recargar conserva documento y vista; «Nuevo diagrama» cancelar/confirmar.
4. **Export:** PNG 1x transparente y JPG 1x fondo blanco; PNG 2x; abrir los archivos en un visor; el zoom visible no cambia.
5. **A11y:** tabulación por paleta, inspector y diálogos; foco visible; `aria-live` en crear/borrar/error de conexión/guardado; drawers operables a ~800 px; aviso bajo 768 px sin perder datos.
6. **Teclado:** Delete, undo/redo, duplicar, F2, Escape, flechas, Ctrl/Cmd+0, Ctrl/Cmd+S.
7. **Persistencia:** recarga tras editar; no hay pérdida silenciosa si el storage falla (edición en memoria sigue).

## Licencias

Dependencias de runtime (van en `dist/`): MIT (`react`, `react-dom`, `@xyflow/react`, `zustand`, `zod`, `html-to-image`). La atribución de React Flow permanece visible.

Herramientas de test: `@axe-core/playwright` y `axe-core` son **MPL-2.0** (solo dev; no se empaquetan). El resto del toolchain es MIT, Apache-2.0, BlueOak-1.0.0 o MIT-0. No hay GPL/AGPL.

## Estado

| Área                          | Estado                                              |
| ----------------------------- | --------------------------------------------------- |
| Documentación y ADRs          | Completa (MVP de casos de uso)                      |
| Código de aplicación          | Release candidate estático                          |
| Calidad / tests               | `npm run check` + Playwright (CI en GitHub Actions) |
| Dependencias / `package.json` | Lockfile versionado; `npm audit --audit-level=high` |

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
6. [Rendimiento](docs/architecture/performance.md)
7. [ADRs](docs/decisions/README.md)
8. [Workflow para agentes](docs/development/agent-workflow.md)
9. [Backlog](docs/tasks/README.md)

Las reglas de Cursor viven en [`.cursor/rules/`](.cursor/rules/). No hay `AGENTS.md`: las Project Rules cubren el mismo rol sin duplicar instrucciones.

## Después del MVP (no implementado)

Siguientes pasos explícitamente **fuera** de este RC: generalization, IndexedDB / multi-documento, otros tipos de diagrama, PDF/SVG persistido, edición táctil, a11y avanzada del lienzo, hosting y analytics.

## Implementación

Un chat, una tarea. Adjuntar la tarea activa y los documentos que ella misma cita.

```text
TASK-001 → TASK-002 → … → TASK-020 → TASK-021 → TASK-022
```
