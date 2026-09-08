# ADR-005: Testing

## Context

Hay lógica pura (UML), chrome React y un canvas que depende de medición real del DOM. React Flow documenta que Playwright o Cypress no necesitan mocks especiales; Jest sí. Vitest 5 se alinea con Vite 8.

## Problem

Elegir runners sin duplicar pirámides ni fingir que jsdom es un browser.

## Options

1. Vitest (jsdom) + Testing Library + Playwright.
2. Jest + Testing Library + Playwright.
3. Vitest Browser Mode + Playwright.
4. Cypress en lugar de Playwright.
5. Solo E2E.

## Decision

Opción 1.

- Vitest 5 + jsdom 30 + Testing Library 16 + user-event 14 + coverage v8.
- Playwright (referencia `1.63.0`) para E2E, con `webServer` al dev server.
- `@axe-core/playwright` en TASK-017.
- Chromium: suite completa. Firefox/WebKit: smokes y spike de export.
- Sin Jest, sin Cypress, sin Vitest Browser Mode en el MVP.
- `npm run check` no incluye E2E (demasiado lento/local-browser); CI sí corre E2E (TASK-020).

## Rationale

Vitest comparte config y transforms con Vite; Jest no está soportado de forma nativa por el pipeline Vite. Playwright cubre drag preciso, descargas, varios motores y traces. Cypress duplicaría esa capa con trade-offs de iframe/multi-origen. Vitest Browser Mode solaparía Playwright y añadiría otro runtime que un agente debe comprender.

Solo E2E haría lenta y opaca la matriz UML.

## Consequences

- Los tests de edges reales viven en Playwright, no en jsdom.
- Hay que mantener `data-testid` / nombres accesibles estables.
- Baselines visuales son un artefacto **fuente** si se revisan; reports HTML no.

## Rejected alternatives

- **Jest:** segundo pipeline de transforms.
- **Cypress:** redundante; Playwright ya cubre descargas y mouse de bajo nivel.
- **Vitest Browser Mode:** tercera forma de «browser» además de Playwright y la validación manual.
- **Testing Library para drag de React Flow:** confianza falsa.
