# TASK-023: Contrato de identidad visual de ArkUML

## Objetivo

Definir una identidad fija orientada a la distribución Open Source y un
contrato de iconografía/tooltips que TASK-024 pueda implementar sin reabrir
decisiones de UX.

## Prioridad

P1

## Dependencias

TASK-022

## Contexto obligatorio

- @docs/product/mvp-spec.md (clasificación UX y accesibilidad)
- @docs/architecture/testing-strategy.md
- @docs/tasks/TASK-007.md

## Estado inicial

El release candidate usa texto, tokens neutrales y los controles SVG de React
Flow. ArkUML tiene nombre de producto pero no isotipo, favicon ni reglas
documentadas de marca. Hay `title` puntuales, pero no un tooltip accesible
compartido. El MVP prohíbe temas personalizables y nuevas dependencias sin
decisión explícita.

## Dentro del alcance

- Posicionamiento, promesa, personalidad y relación entre «Ark» y «UML».
- Isotipo, firma principal/compacta, zona de seguridad, tamaños mínimos,
  variantes y usos incorrectos.
- Paleta fija de tema claro, tipografía del sistema y ratios de contraste.
- Gramática SVG y matriz de iconos para top bar, paleta UML y controles del
  lienzo.
- Comportamiento accesible del tooltip en hover y foco: demora, Escape,
  persistencia, asociación ARIA y estados disabled.
- Definir cuándo un control es icon-only y cuándo conserva etiqueta visible.
- Añadir la fase y sus dos tareas al backlog; aclarar en el MVP que identidad
  fija no equivale a temas personalizables.

## Fuera del alcance

- Implementar React, CSS, SVG, favicon o cambiar screenshots.
- Dark mode, selector de temas, personalización o webfonts.
- Rediseñar nodos, edges o la notación UML exportada.
- Elegir o añadir la licencia del proyecto.
- Naming nuevo, landing page, material de marketing o redes sociales.
- Añadir una librería de iconos o cualquier dependencia.

## Archivos / módulos afectados

- `docs/product/brand-system.md`
- `docs/product/mvp-spec.md`
- `docs/tasks/README.md`
- `docs/tasks/TASK-023.md`
- `docs/tasks/TASK-024.md`

## Cambios esperados

`docs/product/brand-system.md` es el contrato canónico. Un implementador de
TASK-024 copia trazos SVG, tokens, copy, tamaños y el comportamiento del
tooltip sin reabrir decisiones visuales. El MVP deja explícito que una
identidad fija no equivale a temas personalizables.

## Restricciones

- El sistema es una identidad única de producto, no un tema configurable.
- No publicar «Open Source» como hecho hasta que el proyecto tenga una licencia
  aprobada; la elección de licencia requiere una tarea separada.
- Conservar los nombres UML y los nombres accesibles existentes.
- El tooltip complementa el nombre; nunca es información disponible solo por
  hover.
- El color no es el único indicador de estado o tipo de relación.
- Sin ADR: no cambia stack, motor, estado, persistencia ni exportación. Si hace
  falta una dependencia o una fuente externa, detenerse.

## Criterios de aceptación

- [x] `brand-system.md` define estrategia, marca, color, tipografía,
      iconografía, composición, tooltip y límites.
- [x] Cada control de top bar, paleta y zoom tiene símbolo y descripción
      acordados.
- [x] Include y Extend se distinguen sin depender solo del color.
- [x] Hover, foco, Escape, persistencia y disabled están definidos conforme al
      alcance WCAG 2.2 AA del chrome.
- [x] TASK-024 no contiene decisiones visuales abiertas ni requiere paquetes.
- [x] El backlog y la clasificación UX reflejan la fase 9 sin ampliar la
      funcionalidad UML.

## Tests

Revisión documental: comprobar enlaces, contraste declarado, inventario SVG
(isotipo + 16 controles), matriz con nombre accesible y descripción, Include
y Extend con `I`/`E` más trazo discontinuo, y correspondencia entre TASK-024
y el contrato. No se ejecuta UI ni se regeneran baselines en esta tarea.

## Comandos de verificación

```bash
npm run format:check
git diff --check
```

## Stop conditions

- La identidad exige un tema seleccionable, una webfont o una dependencia.
- El isotipo puede confundirse con un elemento insertable del diagrama.
- Un icono cambia la semántica de Association, Include o Extend.
- TASK-024 necesita inventar copy, dimensiones o comportamiento de tooltip.

## Definition of Done

Contrato canónico y dos TASKs enlazados desde el backlog, MVP coherente con una
identidad fija y revisión documental sin decisiones pendientes.

## Evidencia de cierre

Registrada en TASK-028 (2026-09-09). Artefacto canónico versionado:
`docs/product/brand-system.md` (estrategia, isotipo, tokens, matriz de iconos,
tooltip, límites). `mvp-spec.md` clasifica la identidad como fase 9 y aclara
que no equivale a temas. `docs/tasks/TASK-024.md` existe como contrato de
implementación (criterios `[x]` y evidencia propia). Licencia de proyecto:
fuera de esta TASK; cerrada en TASK-027.
