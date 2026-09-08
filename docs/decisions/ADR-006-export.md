# ADR-006: Exportación PNG/JPG

## Context

El MVP debe descargar el **diagrama completo** (no el viewport recortado) como PNG con transparencia y JPG con fondo blanco. React Flow pinta nodos DOM y edges SVG. El ejemplo oficial [Download Image](https://reactflow.dev/examples/misc/download-image) usa `html-to-image` y **fija 1.11.11** porque versiones posteriores no exportan bien (issue abierto). npm latest el 2026-09-07 era `1.11.13`.

Canvas tiene límites de tamaño por navegador (iOS ~4096; escritorio suele más). `toDataURL` materializa un string enorme; `toBlob` es preferible (MDN).

## Problem

Cómo rasterizar DOM+SVG con calidad, sin acoplar dominio al exportador, y cómo evolucionar a PDF después.

## Options

1. `html-to-image@1.11.11` + `canvas.toBlob`, filtrando chrome.
2. `html-to-image` latest (`1.11.13+`).
3. Screenshot del tab (Playwright-only o API no estándar).
4. Redibujar el diagrama en un Canvas/Konva off-screen a partir del dominio.
5. SVG serializado + rasterizar (pdf/svg post-MVP).

## Decision

Opción 1 para el producto.

- Pin exacto `html-to-image@1.11.11`. Subir versión exige ADR y tests de browser.
- Spike cross-browser en TASK-008, producto en TASK-016.
- PNG alpha; JPG fondo blanco quality 0.92; escalas 1x/2x.
- Límites 4096 px por lado y 16 MP.
- Interfaz `exportDiagram` desacoplada del store interno de xyflow.
- PDF/SVG no se implementan; cuando existan, exporters hermanos, no un flag dentro del rasterizer.

## Rationale

Es la ruta documentada por el motor elegido. Reimplementar un renderer Canvas solo para export duplica notación. Latest de html-to-image está explícitamente desaconsejado por xyflow. Capturar la pantalla incluye chrome y depende del viewport.

## Consequences

- Riesgo `foreignObject` (fuentes, markers, Firefox/Safari). El spike es gate.
- Memoria: 2x multiplica píxeles por 4; los límites mitigan.
- Calidad de texto depende de fuentes locales (no Google Fonts remotas en el MVP).
- Si el spike falla de forma material, reabrir este ADR y considerar X6 o un redraw Canvas.

## Rejected alternatives

- **html-to-image latest:** regresiones documentadas por React Flow.
- **Screenshot de página:** incluye UI y recorta el viewport.
- **Konva off-screen ahora:** segundo renderer, notación duplicada.
- **PDF ahora:** fuera de alcance.
