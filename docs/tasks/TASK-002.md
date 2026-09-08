# TASK-002: Calidad y harness de tests

## Objetivo

Dejar un único pipeline local reproducible: formato, lint, tipos, unit tests y smoke E2E.

## Prioridad

P0

## Dependencias

TASK-001

## Contexto obligatorio

- @docs/decisions/ADR-001-frontend-stack.md
- @docs/decisions/ADR-005-testing.md
- @docs/architecture/testing-strategy.md
- @.cursor/rules/testing.mdc

## Estado inicial

SPA mínima con typecheck y build.

## Dentro del alcance

- ESLint 10 + typescript-eslint 8, flat config, recommended + type-checked razonable.
- Prettier **3.9.6 exacto**; ESLint sin reglas de estilo duplicadas (`eslint-config-prettier` si hace falta).
- Vitest 5 + jsdom 30 + Testing Library + user-event + coverage v8.
- Playwright con `baseURL`, `webServer`, proyecto Chromium al menos.
- Smoke E2E: abre la app, ve el heading ArkUML, sin `pageerror`.
- Scripts: `lint`, `format:check`, `test`, `test:coverage`, `test:e2e`, `check` (format → lint → typecheck → unit → build).
- Un test unitario/RTL de render del App.
- Confirmar que `.gitignore` cubre artefactos de test (ya debería).

## Fuera del alcance

- Jest, Cypress, Vitest Browser Mode.
- Husky, lint-staged, commitlint.
- Tests de dominio o canvas.

## Archivos / módulos afectados

- `eslint.config.js` (o `.ts`), `.prettierrc`, `.prettierignore`
- `vitest.config.ts`, `src/test/setup.ts`
- `playwright.config.ts`, `e2e/smoke.spec.ts`
- `package.json`
- `.gitignore` solo si falta alguna ruta de ADR-005

## Cambios esperados

`npm run check` y `npm run test:e2e -- --project=chromium` verdes.

## Restricciones

- No ignorar `e2e/**/__screenshots__/`.
- Prettier pin exacto 3.9.6.
- jsdom 30 implica Node 24.15+ (ya fijado).

## Criterios de aceptación

- [ ] `npm run check` ejecuta el orden determinista y sale 0.
- [ ] Smoke E2E pasa en Chromium.
- [ ] Coverage/report dirs siguen ignorados.

## Tests

Render unitario + smoke E2E.

## Comandos de verificación

```bash
npm run check
npm run test:e2e -- --project=chromium
git status --short
```

## Stop conditions

- Peer conflict que invite a TypeScript 7 o a bajar Node.

## Definition of Done

Pipeline documentado en README, comandos ejecutados, sin artefactos generados en Git.
