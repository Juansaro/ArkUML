# ADR-002: Motor de diagramación

## Context

El MVP necesita nodos UML custom, handles, conexiones dirigidas y no dirigidas, zoom/pan, selección múltiple, grouping ligero (boundary + casos) y un camino hacia PNG/JPG. Debe ser MIT o equivalente para un producto que aún no tiene presupuesto de licencias comerciales.

## Problem

Elegir el motor gráfico sin acoplar el modelo UML a su JSON interno, y sin reconstruir un editor de grafos desde cero.

## Options

1. `@xyflow/react` (React Flow 12).
2. AntV X6.
3. Konva / react-konva (Canvas).
4. Fabric.js.
5. JointJS core (MPL-2.0) o JointJS+.
6. GoJS, yFiles, tldraw (licencias comerciales o de producción).
7. SVG propio.

## Decision

**React Flow 12** (`@xyflow/react`, referencia `12.11.6`).

- Modelo de dominio propio; mapper único.
- Sub-flows: un boundary como nodo padre; casos con `parentId`.
- Atribución visible.
- Reserva técnica: **AntV X6** si el spike de exportación o el presupuesto de rendimiento fallan de forma irrecuperable.
- Reserva extrema de rendimiento: Konva, solo tras perfil incumplido en 100/150 **y** evidencia de que el cuello es DOM, no nuestro código.

## Rationale

React Flow entrega drag, zoom, pan, selección, handles, edges SVG, foco/ARIA y recomendación oficial de Playwright. Los nodos son componentes React, adecuados para texto editable. Licencia MIT. Encaja con el stack de ADR-001.

X6 también es MIT y exporta mejor de fábrica, pero la documentación y el encaje a11y/React son menos claros para un agente que implementa un MVP.

Canvas (Konva/Fabric) exporta nativo y escala el pintado, pero obliga a reconstruir grafo, handles, HTML en nodos y accesibilidad.

Comerciales (GoJS desde ~USD 3 995 individual, yFiles cotizado, tldraw con clave de producción) son lock-in prematuro.

SVG propio maximiza control y minimiza lock-in a costa de reconstruir el editor.

## Addendum Release 2 (TASK-051)

Vigente para la línea **3.0**. No cambia la decisión: el motor sigue
siendo React Flow 12. No se abre X6 ni Konva.

Los kinds de Release 2 se proyectan con **nodos y edges custom** en el
adapter existente:

- Clases: rectángulo de tres compartimentos.
- Componentes: caja con icono de componente; ensamblaje = bola-zócalo
  en el edge (no un clasificador Interface).
- Despliegue: prisma 3D para `node`; icono de documento para `artifact`.
- ER Chen: elipse (`attribute`) y rombo (`er-relationship`).
- Actividades e interacción general: nodos de control (círculo, rombo,
  barra) y marco `ref`.

Eso no persiste `Node` / `Edge` de xyflow. Waypoints persistidos
(W13-01) siguen exigiendo **otro** addendum más un bump de schema.
W17-08/09 siguen solo por C-PERF.

## Consequences

- Exportación raster **no** es nativa: depende de html-to-image y foreignObject (ADR-006). El riesgo se mitiga con spike en TASK-008.
- Hay que disciplina de re-renders (ADR-003, estrategia de rendimiento en la spec).
- El modelo **no** usa `Node` / `Edge` de xyflow como persistencia.
- Sustituir el motor implica reescribir adapter, nodos y edges, no el dominio.

## Rejected alternatives

- **AntV X6 como primera opción:** export y puertos fuertes; peor encaje documentado con a11y y con el workflow React Flow + Testing/Playwright ya investigado. Queda como reserva.
- **Konva/Fabric:** no son motores de diagrama UML; a11y de canvas es débil.
- **JointJS core:** MPL-2.0 y UI/export avanzados empujan a JointJS+.
- **GoJS / yFiles / tldraw:** coste, watermark o clave de producción.
- **SVG propio:** meses de interacción ya resuelta.
- **Mermaid/PlantUML:** no son editores WYSIWYG.
