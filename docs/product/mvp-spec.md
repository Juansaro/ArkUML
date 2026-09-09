# Especificación del MVP

Documento canónico de alcance. Si una tarea contradice este archivo, prevalece este archivo salvo que un ADR posterior lo reemplace.

## Resumen

ArkUML es una SPA desktop-first para editar diagramas UML de **casos de uso**. El MVP debe sentirse fluido, predecible y recuperable. No es una plataforma UML genérica ni un producto SaaS.

Supuestos explícitos:

- Un único documento local activo.
- Un único `SystemBoundary` por documento (creado por defecto, eliminable y recreable).
- Sin imágenes embebidas.
- Pantalla objetivo `>=1024×720`.
- Un usuario, sin autenticación.

## Requisitos funcionales

| ID | Requisito | Nivel |
| --- | --- | --- |
| FR-01 | Crear un `DiagramDocument` v1 con título y boundary «Sistema». | MVP |
| FR-02 | Crear Actor, Use Case y System Boundary desde paleta + click. Máximo un boundary. | MVP |
| FR-03 | Seleccionar uno o varios; editar nombre 1–80 caracteres; mover y eliminar. | MVP |
| FR-04 | Mover y redimensionar el boundary; reparentar casos de uso preservando la posición visual. | MVP |
| FR-05 | Crear Association entre Actor y Use Case. | MVP |
| FR-06 | Crear Include y Extend dirigidos Use Case → Use Case. | MVP |
| FR-07 | Rechazar endpoints, self-loop e Include/Extend duplicados con razón visible. | MVP |
| FR-08 | Undo/redo de mutaciones semánticas; un gesto = una entrada de historial. | MVP |
| FR-09 | Zoom, pan, grid 16 px y fit view sin contaminar el historial. | MVP |
| FR-10 | Autosave y restauración del único workspace local. | MVP |
| FR-11 | «Nuevo diagrama» con confirmación; recuperación ante storage corrupto o cuota. | MVP |
| FR-12 | Exportar el diagrama completo a PNG (transparente) y JPG (fondo blanco), 1x/2x. | MVP |
| FR-13 | Duplicar actores y casos seleccionados, sin relaciones, offset 24 px. | MVP recomendado |
| FR-14 | Operaciones esenciales por teclado y feedback accesible. | MVP recomendado |

Los ítems «MVP recomendado» **sí se implementan** en este MVP. «Post-MVP» no.

## Clasificación UX

| Superficie / capacidad | Comportamiento | Clasificación |
| --- | --- | --- |
| Top bar | Título, Nuevo, undo/redo, Exportar, ayuda breve | MVP |
| Paleta izquierda | Actor, Caso de uso, Boundary, Association, Include, Extend. Click-tool → click-canvas | MVP |
| Canvas | Grid 16, selección, marquee, handles contextuales, zoom/pan/fit | MVP |
| Inspector derecho | Nombre, tipo, endpoints, errores; alternativa de relación por teclado | MVP recomendado |
| Status bar | Zoom y Guardando / Guardado / Error. Sin toast de éxito de autosave | MVP recomendado |
| Atajos listados más abajo | Teclado de alta frecuencia | MVP recomendado |
| Drawers 768–1023 px | Paleta e inspector colapsables | MVP recomendado |
| Aviso `<768` px | Edición no soportada; datos intactos | MVP recomendado |
| Minimap, auto-layout, alignment guides, waypoints | — | Post-MVP |
| Temas, estilos custom, plantillas | — | Post-MVP |
| Edición touch / mobile | — | Post-MVP |
| Accesibilidad completa con lector de pantalla sobre el lienzo | Chrome UI AA; lienzo con limitaciones publicadas | Post-MVP (lienzo avanzado) |

## Elementos UML

Obligatorios en el MVP:

- `Actor`
- `UseCase`
- `SystemBoundary` (máximo uno)

Post-MVP:

- Generalization de actores o casos de uso
- Extension points, condiciones de extend
- Notas, paquetes, actores no humanos especializados, multiplicidad

### Notación

- Actor: figura SVG de palo + nombre debajo.
- Use Case: elipse + nombre centrado.
- System Boundary: rectángulo con nombre en el borde superior.
- Association: línea sólida, sin flecha.
- Include: línea discontinua, estereotipo «include», flecha abierta hacia el caso incluido.
- Extend: línea discontinua, estereotipo «extend», flecha abierta hacia el caso base.

Los estereotipos usan comillas angulares UML, no ASCII `<< >>` como único recurso visual.

## Reglas de conexión

| Relación | Orígenes válidos | Destinos válidos | Dirección persistida | Visual |
| --- | --- | --- | --- | --- |
| Association | Actor o UseCase | El otro tipo | Siempre `Actor` como `sourceId` | No dirigida |
| Include | UseCase | UseCase distinto | Origen = caso que incluye; target = caso incluido | Dirigida al target |
| Extend | UseCase | UseCase distinto | Origen = caso de extensión; target = caso base | Dirigida al target |

Prohibido:

- Cualquier relación con `SystemBoundary` como extremo.
- Include/Extend reflexivos.
- Duplicado de la misma tupla `(kind, sourceId, targetId)`.
- Association Actor–Actor o UseCase–UseCase.

No se validan ciclos Include/Extend en el MVP.

Si el usuario arrastra Association UseCase → Actor, el dominio **normaliza** `sourceId` al actor. Include y Extend **no** se invierten: un drag en sentido contrario es otra semántica o un error si los tipos no coinciden.

Ayuda contextual (copy de UI, antes de conectar):

- Include: "Origen: caso que incluye. Destino: caso incluido. Arrastra del origen al destino; el sentido no se invierte."
- Extend: "Origen: caso que extiende. Destino: caso base. Arrastra del origen al destino; el sentido no se invierte."

El handle de salida es el origen persistido. En el inspector, Include usa «Origen (incluye)» / «Destino (incluido)» y Extend usa «Origen (extiende)» / «Destino (caso base)».

## Geometría, selección y edición

- Coordenadas relativas al `parentId` si existe; absolutas en el canvas en caso contrario.
- Actor **nunca** tiene `parentId`.
- UseCase **puede** tener `parentId` de un boundary.
- Boundary no tiene padre.
- Actor cuyo centro cae dentro del boundary: warning no bloqueante.
- UseCase cuyo centro queda fuera del boundary y no tiene padre: warning no bloqueante.
- Eliminar boundary: los casos de uso hijos pasan a coordenadas absolutas equivalentes y pierden `parentId`.
- Eliminar elemento: se eliminan todas las relaciones incidentes.
- Duplicar: solo Actor y UseCase; offset `(24, 24)`; sin relaciones; boundary no se duplica.
- Nombres: trim, longitud 1–80, duplicados permitidos. Vacío o inválido conserva el valor anterior y muestra error.
- Boundary mínimo `320×240`. Actor y UseCase no se redimensionan en el MVP.
- Confirmación rutinaria: no. Sí hay confirmación en «Nuevo diagrama» si hay cambios.

## Atajos (MVP recomendado)

| Atajo | Acción |
| --- | --- |
| Delete / Backspace | Eliminar selección (no durante edición de texto) |
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y | Redo |
| Ctrl/Cmd+D | Duplicar actores/casos seleccionados |
| F2 / Enter | Editar nombre; Enter confirma |
| Escape | Cancelar edición, herramienta o conexión |
| Flechas / Shift+flechas | Mover 1 px / 16 px |
| Ctrl/Cmd+0 | Fit view |
| Ctrl/Cmd+S | Flush de autosave |
| Space+drag / botón medio | Pan |
| Rueda sobre el canvas | Zoom alrededor del cursor |
| Click izquierdo + drag en vacío | Marquee |
| Click en pane | Limpiar selección |

## Requisitos no funcionales

| ID | Objetivo |
| --- | --- |
| NFR-01 | Chrome/Edge actuales, Firefox actual, Safari `>=16.4`. Sin Internet Explorer. |
| NFR-02 | Escenario objetivo: 100 elementos y 150 relaciones. Estrés funcional: 200 / 300. |
| NFR-03 | p95 de frame `<=33 ms` durante drag en el escenario objetivo. Respuesta visible de click/selección `<=100 ms`. |
| NFR-04 | Restore del escenario objetivo `<=1 s`. Export 2x `<=3 s` en máquina de referencia documentada en TASK-019. |
| NFR-05 | TypeScript `strict`. `src/domain` no importa React, DOM ni `@xyflow/react`. |
| NFR-06 | Chrome de la aplicación orientado a WCAG 2.2 AA. Limitaciones del lienzo publicadas. |
| NFR-07 | Ninguna pérdida silenciosa por parse o cuota. La edición en memoria continúa si el storage falla. |
| NFR-08 | Build estático reproducible con `npm ci` y lockfile. |
| NFR-09 | Una tarea por cambio. Documentación canónica, no duplicada. |

Los tiempos de NFR-03 y NFR-04 son **objetivos de diseño**. Solo se convierten en hechos medidos en TASK-019.

## Accesibilidad (alcance honesto)

Incluido:

- Nombres accesibles en controles del chrome.
- Orden de tabulación lógico y foco visible. No se ocultan controles enfocados.
- Región `aria-live` única para creación, borrado, errores de conexión y estado de guardado. Los avisos geométricos viven en el inspector, no en esa región.
- Operaciones esenciales por teclado: paleta + inspector para colocar elementos; inspector para elegir extremos de relación sin arrastrar handles.
- Focus trap y retorno de foco en diálogos; drawers 768–1023 px operables (inert / fuera de tabulación al cerrar).
- Contraste de notación que no dependa solo del color (sólida vs discontinua, presencia de flecha y estereotipo).
- Scan axe del shell y estados principales; cero violaciones critical/serious en lo cubierto.

Limitaciones publicadas del lienzo:

- El grafo de React Flow no se recorre como un documento equivalente para lector de pantalla. Los handles son ratón-first (`aria-hidden`) y `disableKeyboardA11y` evita el conflicto con flechas (nudge de 1 px / 16 px).
- Axe cubre el chrome (shell, inspector, diálogos, drawers) y excluye el interior de `.react-flow`.
- Por debajo de 768 px se muestra un aviso; la edición no está soportada y el documento no se borra.
- No se declara conformidad WCAG total ni un editor paralelo para screen reader.

Fuera del MVP:

- Edición gráfica completa anunciada de forma equivalente a un usuario vidente.
- Conformidad WCAG total del canvas de React Flow.

## Rendimiento (estrategia)

- Memoizar nodos/edges custom, `nodeTypes`, `edgeTypes`, callbacks y el mapper.
- Toolbar e inspector se suscriben a IDs y flags, no al array completo durante drag.
- Historial y autosave se comprometen en `dragStop` / `resizeEnd`, no en cada frame.
- Un listener de atajos a nivel editor.
- Sin virtualización, Canvas o WebGL hasta que un perfil del escenario objetivo incumpla el presupuesto.
- Exportación fuera del gesto, con bloqueo de doble ejecución y liberación de object URLs.

## Fuera de alcance

No implementar, ni siquiera «por si acaso»:

- Otros tipos de diagrama UML.
- Generalization.
- PDF, SVG persistido, import/export JSON de usuario, clipboard de imagen.
- Backend, autenticación, usuarios, colaboración, sincronización, SaaS.
- Multi-documento, IndexedDB, PWA, SEO/SSR.
- Auto-layout, routing con waypoints, minimapa, temas, personalización visual.
- Edición táctil / móvil nativa.
- Husky, lint-staged, commitlint como requisito del MVP (Conventional Commits se documentan, no se imponen).

Preparar interfaces (`DiagramRepository`, `kind` discriminado) **no autoriza** implementar esas capacidades.
