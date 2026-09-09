# TASK-021: Cerrar huecos del checklist RC

## Objetivo

Completar lo que el pase manual de TASK-020 no pudo firmar: gestos de lienzo con ratón, visor de export y smokes Firefox/Safari.

## Prioridad

P1

## Dependencias

TASK-020

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/testing-strategy.md
- @README.md (sección «Checklist manual (RC)»)

## Estado inicial

RC estático en `dist/` (`vite preview`). E2E Chromium ya cubre reparent/resize, pan y export por firma. El pase Chrome DevTools MCP de TASK-020 no pudo: pan Space/botón medio, reparent/resize con arrastre, abrir PNG/JPG en un visor, ni Firefox/Safari. Los nodos del lienzo no son clicables vía árbol a11y (limitación publicada del canvas).

## Dentro del alcance

- Recorrer en Chrome o Edge, a `>=1024×720`, contra `npm run preview`: pan (Space+drag o botón medio), reparent de un caso de uso al entrar/salir del boundary, resize del boundary (mínimo 320×240).
- Exportar PNG 1x y JPG 1x; abrir ambos archivos en un visor del SO y comprobar transparencia vs fondo blanco.
- Smoke del checklist (arranque, crear un actor, export PNG, recarga) en Firefox actual y Safari `>=16.4`.
- README: el status idle es «—» hasta el primer save; «Guardado» aparece tras autosave o restore. El MCP de Chrome no sustituye Playwright ni el ratón real para drag del lienzo.

## Fuera del alcance

- Hacer el grafo de React Flow operable por lector de pantalla o por uids a11y.
- Nuevos tipos UML, PDF, hosting.
- Cambiar baselines visuales ni el job CI `windows-latest`.

## Archivos / módulos afectados

- `README.md` (checklist / limitaciones)
- evidencia en el handoff (no versionar capturas de visor)

## Cambios esperados

Checklist RC cerrado con evidencia humana. Copy de status alineado con el comportamiento real.

## Restricciones

No borrar ni skippear E2E existentes. No ampliar el MVP.

## Criterios de aceptación

- [ ] Pan, reparent y resize comprobados a mano (o Playwright `--headed`) en el bundle de `preview`.
- [ ] PNG y JPG abiertos en un visor: PNG con esquinas transparentes; JPG opaco blanco.
- [ ] Smoke Firefox y Safari `>=16.4` sin pérdida de datos al recargar.
- [ ] README no exige «Guardado» en el primer paint de un workspace vacío.

## Tests

No hace falta suite nueva si el E2E de reparent/export sigue verde. El valor es el pase manual documentado.

## Comandos de verificación

```bash
npm run build
npm run preview
npm run test:e2e -- --project=chromium --grep "reparent|exportación|pan"
```

## Stop conditions

- Reescribir hit-testing del canvas «para que el agente pueda clicar nodos».

## Definition of Done

Handoff con qué se pulsó, en qué navegador y qué falló. README coherente con idle vs Guardado.
