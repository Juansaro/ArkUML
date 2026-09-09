# Sistema de marca de ArkUML

Contrato visual canónico para el producto y su chrome. Este documento define
una identidad fija; no autoriza temas, personalización visual ni cambios en la
notación UML persistida o exportada. TASK-024 copia medidas, copy y trazos de
aquí; no reinterpreta ni inventa.

## Estrategia

**Posicionamiento:** ArkUML — modelado esencial, local y confiable.

**Promesa:** «Casos de uso claros, sin fricción.»

El nombre combina:

- **Ark:** resguardo, continuidad y confianza en el trabajo local.
- **UML:** precisión técnica y reconocimiento inmediato del estándar.

La personalidad es precisa, serena, abierta y técnica. La interfaz evita tanto
la densidad corporativa de las suites multipropósito como una estética lúdica
que reste credibilidad al modelado.

ArkUML es **Open Source** bajo Apache License 2.0 (SPDX `Apache-2.0`). El
texto canónico está en [`LICENSE`](../../LICENSE). Copyright 2026 Juan
Sarmiento. Esa afirmación es un hecho legal, no solo una intención de
distribución.

## Marca

### Isotipo

El isotipo es un `SystemBoundary` simplificado cuya arista superior construye
una «A». Dos nodos conectados dentro representan el acuerdo entre actores y
casos de uso. **No es un barco.** Nunca se lee como un elemento insertable del
lienzo: en el chrome siempre aparece junto al wordmark o en favicon, y su
silueta (pico en A + dos nodos) no coincide con el rectángulo plano del icono
de paleta «Límite del sistema».

No se inserta en el diagrama ni en una exportación. No es una notación UML
nueva.

SVG maestro (`viewBox="0 0 24 24"`, trazo 2, extremos y uniones redondeados,
una sola tinta `currentColor`, sin relleno decorativo, sin gradientes ni
sombras, sin detalle menor de 1.5 unidades):

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  <path d="M4 20V6H9L12 3L15 6H20V20Z" />
  <circle cx="8" cy="14" r="1.5" />
  <circle cx="16" cy="14" r="1.5" />
  <path d="M9.5 14H14.5" />
</svg>
```

### Variantes y uso

| Variante | Composición | Dónde |
| --- | --- | --- |
| Firma principal | Isotipo 24×24 Blueprint + wordmark texto «ArkUML» | Top bar del editor. El `h1` permanece visible; no se sustituye por imagen. |
| Firma compacta | Solo isotipo, nombre accesible fuera de la imagen | Favicon. No se usa para ocultar el `h1` del editor. |
| Monocroma clara | `currentColor` = Ink sobre fondo claro | No necesaria en el chrome del MVP si la principal está disponible. |
| Inversa | Blanco sobre Ark Navy | Reservada; el MVP no la pinta. |

Tamaños mínimos: isotipo 16 px; en top bar se usa **24 px**. Firma horizontal
no baja de 96 px de ancho (isotipo + gap 8 px + wordmark). Zona libre mínima
alrededor de la marca: un cuarto de la altura del isotipo (6 px en top bar).

Wordmark: familia `--font-sans`, peso `--font-weight-semibold` (600), talla
`--font-size-lg`, color `--color-fg`. Sin letter-spacing extra. El isotipo de
cabecera usa `color: var(--color-brand)`. Alinear isotipo y wordmark al centro
vertical (`align-items: center`), gap `--space-2` (8 px). La altura de la top
bar permanece `--shell-topbar-height` (3 rem).

Prohibido: rotar, estirar, degradados, separar trazos, recolorear partes por
independiente, usarlo como botón de una acción que no sea identidad de
producto, o dibujar el pico en A en el icono de paleta del boundary.

### Favicon

Archivo `public/favicon.svg`. Tinta Blueprint sobre fondo blanco. El `href` es
relativo para respetar `base: "./"`: en `index.html`,
`<link rel="icon" href="./favicon.svg" type="image/svg+xml" />`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" fill="#ffffff" />
  <g
    fill="none"
    stroke="#1d4ed8"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 20V6H9L12 3L15 6H20V20Z" />
    <circle cx="8" cy="14" r="1.5" />
    <circle cx="16" cy="14" r="1.5" />
    <path d="M9.5 14H14.5" />
  </g>
</svg>
```

## Color

ArkUML conserva la base neutral del release candidate y convierte el azul de
foco actual en acento de marca. Identidad única de tema claro: no hay selector
ni tokens por tema.

Tokens **existentes** que se conservan con el mismo valor:

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-fg` | `#18181b` | Texto e iconos (Ink) |
| `--color-muted` | `#52525b` | Ayuda, metadatos, deshabilitado |
| `--color-surface` | `#ffffff` | Paneles y controles |
| `--color-bg` | `#f4f4f5` | Chrome exterior y hover de botón |
| `--color-border` | `#d4d4d8` | Separadores de panel (decorativo; contraste 1.48:1) |
| `--color-canvas` | `#e4e4e7` | Lienzo (sin cambio) |
| `--color-grid` | `#d4d4d8` | Grid (sin cambio) |
| `--color-notice-bg` | `#fef3c7` | Fondo de aviso (ámbar) |
| `--color-notice-fg` | `#78350f` | Texto de aviso |
| `--color-notice-border` | `#d97706` | Borde de aviso (ámbar; no es el único indicador) |
| `--color-shadow` | `rgb(24 24 27 / 0.18)` | Sombra de tooltip y controles de lienzo |

Tokens **nuevos o reasignados** en TASK-024:

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-brand` | `#1d4ed8` | Blueprint: isotipo de cabecera, acción y pressed |
| `--color-focus` | `var(--color-brand)` | Anillo de foco; mismo hex que hoy (`#1d4ed8`) |
| `--color-brand-deep` | `#172554` | Ark Navy: fondo de tooltip |
| `--color-control-border` | `#71717a` | Borde de controles interactivos del chrome |
| `--z-tooltip` | `35` | Por debajo de `--z-dialog` (40) y por encima de `--z-drawer` (20) |

`--color-focus` se redefine como alias de `--color-brand` para no duplicar el
hex. El resto de tokens de espacio, tipo, radio, z-index y shell no cambian.

Contrastes de referencia (WCAG 2.2):

| Par | Ratio | Umbral |
| --- | --- | --- |
| Ink / blanco | 17.72:1 | texto ≥ 4.5:1 |
| Muted / blanco | 7.73:1 | texto ≥ 4.5:1 |
| Muted / `--color-bg` | 7.03:1 | texto ≥ 4.5:1 |
| Blueprint / blanco | 6.70:1 | texto y no textual |
| Ark Navy / blanco (y blanco / Navy) | 14.69:1 | tooltip |
| Control border / blanco | 4.83:1 | no textual ≥ 3:1 |
| Control border / `--color-bg` | 4.40:1 | no textual ≥ 3:1 |
| Aviso fg / aviso bg | 8.15:1 | texto ≥ 4.5:1 |

Los bordes `--color-border` no comunican estado. Los botones del chrome usan
`--color-control-border`. El color nunca es el único indicador de herramienta
activa, relación, error o disponibilidad.

## Tipografía y voz

Familia contractual: `"Segoe UI", system-ui, sans-serif` vía `--font-sans`.
No se descarga webfont ni se añade dependencia de fuentes.

La UI usa verbos breves y los nombres UML ya existentes. No se traducen
Include/Extend. Los atajos en tooltips usan la misma grafía que la ayuda:
`Ctrl/Cmd`, sin detectar plataforma.

## Iconografía

Todos los iconos son SVG locales. Sin kit, sin paquete, sin copiar un icon set
externo.

Envoltorio común (excepto favicon):

- `viewBox="0 0 24 24"`
- Tamaño visual **20×20** px dentro de un hit target mínimo **32×32** px
- `fill="none"` `stroke="currentColor"` `stroke-width="2"`
  `stroke-linecap="round"` `stroke-linejoin="round"`
- `aria-hidden="true"` `focusable="false"`
- Alineación óptica al centro; legible a 100 % y 200 % de zoom del navegador

Include y Extend: `stroke-dasharray="4 3"` **solo** en el segmento conector;
la flecha abierta y la letra `I`/`E` son trazo continuo. La letra es path, no
`<text>`, para no depender de fuentes.

El icono de paleta «Límite del sistema» es un rectángulo con cabecera. El
isotipo no reutiliza ese path.

### Inventario de trazos

Cada `id` es la clave del componente `Icon`. Copiar los `d` y atributos tal
cual.

**`mark`** — ver SVG maestro arriba.

**`palette`** — panel con franja izquierda:

```text
<path d="M4 5h16v14H4z" />
<path d="M9 5v14" />
```

**`inspector`** — panel con franja derecha:

```text
<path d="M4 5h16v14H4z" />
<path d="M15 5v14" />
```

**`newDiagram`** — documento con `+`:

```text
<path d="M7 3h7l5 5v13H7z" />
<path d="M14 3v5h5" />
<path d="M12 11v6" />
<path d="M9 14h6" />
```

**`undo`** — flecha curva a la izquierda:

```text
<path d="M8 13 4 9l4-4" />
<path d="M4 9h11a5 5 0 0 1 0 10h-3" />
```

**`redo`** — flecha curva a la derecha:

```text
<path d="M16 13l4-4-4-4" />
<path d="M20 9H9a5 5 0 0 0 0 10h3" />
```

**`export`** — marco con flecha de salida:

```text
<path d="M4 7h11v12H4z" />
<path d="M14 9l6-5" />
<path d="M16 4h4v4" />
```

**`help`** — `?` en círculo:

```text
<circle cx="12" cy="12" r="9" />
<path d="M9.1 9.2a3 3 0 1 1 3.7 2.9c-.8.4-1.3 1-1.3 1.9" />
<path d="M12 17.5v.01" />
```

**`zoomIn`** — lupa con `+`:

```text
<circle cx="10.5" cy="10.5" r="6.5" />
<path d="M15.2 15.2 20 20" />
<path d="M10.5 8v5" />
<path d="M8 10.5h5" />
```

**`zoomOut`** — lupa con `−`:

```text
<circle cx="10.5" cy="10.5" r="6.5" />
<path d="M15.2 15.2 20 20" />
<path d="M8 10.5h5" />
```

**`fitView`** — cuatro esquinas:

```text
<path d="M9 4H4v5" />
<path d="M15 4h5v5" />
<path d="M20 15v5h-5" />
<path d="M4 15v5h5" />
```

**`actor`** — figura UML de palo (canónica, no el viewBox 48×72 del nodo):

```text
<circle cx="12" cy="5" r="3" />
<path d="M12 8v7" />
<path d="M7 11h10" />
<path d="M12 15 8 21" />
<path d="M12 15l4 6" />
```

**`useCase`** — elipse UML:

```text
<ellipse cx="12" cy="12" rx="9" ry="5.5" />
```

**`systemBoundary`** — rectángulo UML con cabecera (sin pico en A):

```text
<path d="M4 5h16v14H4z" />
<path d="M4 9h16" />
```

**`association`** — segmento continuo entre dos nodos, sin flecha:

```text
<circle cx="5" cy="12" r="2" />
<circle cx="19" cy="12" r="2" />
<path d="M7 12h10" />
```

**`include`** — discontinua, flecha abierta, distintivo `I`:

```text
<path d="M3 12h11" stroke-dasharray="4 3" />
<path d="M12 9.5 15 12l-3 2.5" />
<path d="M18 8v8" />
<path d="M16.5 8h3" />
<path d="M16.5 16h3" />
```

**`extend`** — discontinua, flecha abierta, distintivo `E`:

```text
<path d="M3 12h11" stroke-dasharray="4 3" />
<path d="M12 9.5 15 12l-3 2.5" />
<path d="M17 8v8" />
<path d="M17 8h3.5" />
<path d="M17 12h2.5" />
<path d="M17 16h3.5" />
```

Include y Extend no se distinguen solo por color ni solo por la flecha: la
letra permanece visible. Estos iconos no sustituyen línea, flecha ni
estereotipo del diagrama.

Los ids de `Icon` van en camelCase. En paleta se conectan a los `EditorTool`
existentes sin renombrar ni el icono ni la herramienta: `useCase` →
`use-case`, `systemBoundary` → `system-boundary`. El resto coincide (`actor`,
`association`, `include`, `extend`).

## Matriz de controles

El **nombre accesible** es el que ya usan los tests (`getByRole`). El tooltip
es `aria-describedby`, nunca el nombre. Icon-only: el nombre vive en
`aria-label`. Paleta: el nombre es el texto visible.

`Ctrl/Cmd` se escribe literalmente.

| Superficie | Icono | Composición | Nombre accesible | Descripción (tooltip) | Indisponible |
| --- | --- | --- | --- | --- | --- |
| Top bar | `palette` | Icon-only. Solo visible a `max-width: 1023px`, como hoy | Paleta | Cerrado: «Abrir paleta.» Abierto: «Cerrar paleta.» según `aria-expanded` | — |
| Top bar | `inspector` | Icon-only. Mismo breakpoint | Inspector | Cerrado: «Abrir inspector.» Abierto: «Cerrar inspector.» | — |
| Top bar | `newDiagram` | Icon-only | Nuevo | «Crear un diagrama nuevo.» | — |
| Top bar | `undo` | Icon-only | Deshacer | «Deshacer (Ctrl/Cmd+Z).» | «Nada que deshacer (Ctrl/Cmd+Z).» |
| Top bar | `redo` | Icon-only | Rehacer | «Rehacer (Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y).» | «Nada que rehacer (Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y).» |
| Top bar | `export` | Icon-only | Exportar | «Exportar como PNG o JPG.» | — |
| Top bar | `help` | Icon-only | Ayuda | «Ver ayuda y atajos.» | — |
| Paleta | `actor` | Icono + etiqueta | Actor | «Crear actor.» | — |
| Paleta | `useCase` | Icono + etiqueta | Caso de uso | «Crear caso de uso.» | — |
| Paleta | `systemBoundary` | Icono + etiqueta | Límite del sistema | «Crear límite del sistema.» | Reutilizar `BOUNDARY_EXISTS_REASON`: «Ya existe un límite del sistema. El documento admite uno solo.» |
| Paleta | `association` | Icono + etiqueta | Asociación | «Unir un actor y un caso de uso.» | — |
| Paleta | `include` | Icono + etiqueta | Include | «Origen: caso que incluye. Destino: caso incluido. Arrastra del origen al destino; el sentido no se invierte.» | — |
| Paleta | `extend` | Icono + etiqueta | Extend | «Origen: caso que extiende. Destino: caso base. Arrastra del origen al destino; el sentido no se invierte.» | — |
| Lienzo | `zoomIn` | Icon-only | Acercar | «Acercar.» | «El zoom ya está en el máximo (200%).» cuando `zoom >= 2` |
| Lienzo | `zoomOut` | Icon-only | Alejar | «Alejar.» | «El zoom ya está en el mínimo (50%).» cuando `zoom <= 0.5` |
| Lienzo | `fitView` | Icon-only | Ajustar vista | «Ajustar todo el diagrama (Ctrl/Cmd+0).» | — |

No migrar a iconos: título del documento, tagline «Editor de diagramas de
casos de uso», «Cerrar paneles», campos del inspector, acciones de diálogos.
Esos controles conservan etiqueta visible y no reciben la primitiva Tooltip.

## Composición por superficie

- **Top bar:** grupo de marca (isotipo 24 px + `h1` «ArkUML», `display: flex`,
  `align-items: center`, gap `--space-2`) + título del documento + tagline.
  `.identity` conserva `flex: 1 1 12rem`, `min-width: 0`, gap `--space-3`
  entre el grupo de marca y el título, ellipsis en el título, y pasa a
  `align-items: center` (el isotipo de 24 px no se alinea por baseline). Las
  acciones y toggles son icon-only 32×32 px (`box-sizing: border-box`, padding
  6 px, icono 20 px). Conservan `aria-haspopup` / `aria-expanded` /
  `aria-controls` actuales en Exportar, Ayuda y drawers.
- **Paleta:** fila icono 20 px + gap 8 px + etiqueta; botón a ancho completo,
  `min-height` 32 px, `text-align: start`. El tooltip no repite la etiqueta
  como única información.
- **Controles del lienzo:** sustituyen `<Controls>` de React Flow. Icon-only
  32×32, pila vertical (`flex-direction: column`, gap `--space-1`), esquina
  inferior izquierda `left: 15px; bottom: 15px`. Panel: fondo
  `--color-surface`, borde 1 px `--color-control-border`, radio
  `--radius-sm`, padding `--space-1`, `box-shadow: 0 1px 3px var(--color-shadow)`.
  El wrapper conserva la clase `.react-flow__controls` para seguir excluido
  del export. Grupo con `aria-label="Controles del lienzo"`. Zoom `min=0.5`
  `max=2`; fit `{ padding: 0.2, duration: 0 }`; no escribe historial.
  Botones del chrome: radio `--radius-sm`.
- **Inspector y diálogos:** sin iconificar.

Estados de `ToolButton` (tokens, sin color como único indicador):

| Estado | Borde | Fondo | Tinta | Otros |
| --- | --- | --- | --- | --- |
| Reposo | `--color-control-border` | `--color-surface` | `--color-fg` | — |
| Hover (disponible) | `--color-control-border` | `--color-bg` | `--color-fg` | cursor pointer |
| `aria-pressed="true"` | `--color-brand` | `--color-bg` | `--color-fg` | además de `aria-pressed` |
| Foco visible | anillo global `:focus-visible` | — | — | no ocultar el control |
| `aria-disabled="true"` | `--color-control-border` | `--color-surface` | `--color-muted` | sin `opacity` (anula `opacity: 0.7` de `button[aria-disabled]` / `:disabled` en `globals.css`); cursor `not-allowed`; no `disabled` nativo en controles que deban explicar el motivo |

Deshacer, Rehacer, boundary existente y zoom en tope usan `aria-disabled` más
bloqueo de click/Enter/Space (mismo patrón que `InertButton`). No mutan.

## Tooltip accesible

El tooltip es ayuda complementaria. Nunca es el nombre del control ni la única
vía de una información necesaria para operar (las etiquetas UML siguen
visibles en paleta; los icon-only tienen `aria-label`).

Comportamiento (chrome WCAG 2.2 AA, criterio 1.4.13):

| Evento | Resultado |
| --- | --- |
| Puntero entra en el trigger | Abrir tras **400 ms**. Si sale antes, cancelar. |
| Foco de teclado en el trigger | Abrir **sin demora** (0 ms). |
| Puntero recorre el hueco de 8 px hacia el tooltip | Permanece; `hideDelay` **100 ms** solo tras dejar trigger y tooltip. |
| Hover sobre el tooltip | Permanece (`pointer-events: auto`). |
| Escape | Cierra **de inmediato**, no mueve el foco, no dispara otra acción del editor en ese `keydown` (ni cancelar herramienta, ni cerrar drawer/diálogo). |
| Blur del trigger | Cierra de inmediato (0 ms) si el foco no está en el trigger. |
| Click / activar el trigger | El tooltip puede permanecer; no bloquea la acción. |
| Abrir otro tooltip | Solo uno visible; el anterior se cierra al instante. |
| Trigger `aria-disabled` | Mismo delay/foco; el contenido es la columna «Indisponible». |

Marcación:

- Un único nodo en portal a `document.body`, `id` estable vía `useId`,
  `data-testid="editor-tooltip"`.
- `role="tooltip"`. El trigger pone `aria-describedby` solo mientras el
  tooltip está abierto.
- No `aria-live`, no `aria-haspopup`, no `aria-expanded` por el tooltip, no
  `title`.
- No recibe foco tab, no contiene botones ni enlaces. Sin caret/flecha.

Colocación:

- Separación 8 px del trigger. Margen mínimo al viewport 8 px.
- Preferida: **abajo** en top bar, **derecha** en paleta, **izquierda** en
  controles de canvas.
- Si no cabe: invertir al lado opuesto; si aún no cabe, clamp al viewport.
- No tapar el centro del trigger.

Apariencia:

- Fondo `--color-brand-deep`, texto `#ffffff`, talla `--font-size-sm`,
  `line-height: var(--line-height)`, `max-width: 18rem`, `padding: 6px 8px`,
  radio `--radius-sm` (4 px), `box-shadow: 0 1px 3px var(--color-shadow)`,
  `z-index: var(--z-tooltip)`.
- `TooltipProvider` se monta una vez en `EditorShell`.

## Límites

Este sistema no incluye dark mode, temas, personalización, ilustraciones,
animación de marca, elección de licencia, webfonts, librerías de iconos,
nuevos tipos UML, cambios al documento persistido ni alteraciones de
exportación. Los assets de marca forman parte del chrome y se excluyen del
raster del diagrama como el resto del shell.
