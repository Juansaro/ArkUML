# Especificación Post-MVP

Contrato de lo que **puede** seguir al MVP. No autoriza implementación.
`mvp-spec.md` sigue ganando para el producto actual. Los ADRs vigentes
ganan sobre este archivo hasta que se reabran en una TASK posterior.

El inventario desglosado vive en
[`docs/tasks/post-024/roadmap.md`](../tasks/post-024/roadmap.md). Este
archivo es la spec; el roadmap no lo es.

La política de migraciones está en
[`schema-evolution.md`](../architecture/schema-evolution.md). Cómo se
añade un `document.kind` está en
[`diagram-kinds.md`](../architecture/diagram-kinds.md). Una TASK de
freeze (como TASK-033) es la única que puede promover un subconjunto
maduro a TASK ejecutables. Hasta entonces no hay Generalization,
IndexedDB, PDF, temas ni un segundo tipo a medias (regla TASK-020).

## Resumen

ArkUML en **1.x** permanece una SPA desktop-first de **casos de uso**,
local, un usuario, sin SaaS. El Post-MVP profundiza ese editor y **puede**
abrir una línea **2.x** con más `document.kind`, empezando por clases.
No es un producto en la nube ni un kit UML que aterrice todos los tipos
a la vez.

Supuestos que **no** cambian hasta una revisión explícita de este
contrato:

- Un único documento local activo (autosave). No hay multi-documento.
- Kind `use-case`: un único `SystemBoundary` por documento. Otros kinds
  definen su propia cardinalidad cuando existan.
- Sin imágenes embebidas.
- Pantalla objetivo `>=1024×720`.
- Identidad visual fija (`brand-system.md`): no hay selector de tema.

IndexedDB no está elegido (condicional C-QUOTA). El envelope JSON y el
bump de schema están en `schema-evolution.md`. Este contrato marca qué
capacidad es in-scope, más tarde o exclusión.

## Versionado

Hay tres números distintos. No se sustituyen entre sí.

| Número | Qué identifica | Valor actual |
| --- | --- | --- |
| Producto | Promesa al usuario (SemVer de distribución) | MVP shipped (TASK-030). `package.json` sigue `0.0.0` hasta un tag explícito; este contrato no lo cambia. El primer tag de distribución del MVP es **1.0.0**. |
| `schemaVersion` | Forma de `DiagramDocument` | `1` |
| `storageVersion` | Envelope de `WorkspaceSnapshot` | `1` |

Línea **1.x** = producto compatible con documentos schema `1`. Línea
**2.x** = ruptura de esa promesa (schema `>1` y/o cambio de producto que
el MVP no puede abrir sin `migrate()`).

### Qué es patch, minor y major

| SemVer | Ejemplos | Schema / storage |
| --- | --- | --- |
| Patch `1.0.x` | Defectos, copy, a11y del chrome ya especificado, pulido que no añade FR | Siguen `1` / `1` |
| Minor `1.x.0` | FR Post-MVP **aditivos** que un documento schema `1` sigue abriendo en 1.0 (solo chrome, warnings, o archivo JSON del mismo documento) | Schema `1`. Campos persistidos nuevos no entran: `strictObject` los haría unloadable en 1.0 (`schema-evolution.md`). `storageVersion` solo sube si cambia el envelope, no el documento |
| Major `2.0.0` | Nuevo `kind` de elemento o relación; el primer `document.kind` distinto de `use-case` (W17-13 clases u otro tipo extra); dejar de cargar schema `1` sin migración; cambiar la matriz de conexión del MVP de forma incompatible | `schemaVersion >= 2` y [`schema-evolution.md`](../architecture/schema-evolution.md) **antes** de tocar persistencia |

### Qué rompe el MVP (prohibido en 1.x)

- Debilitar o retirar FR-01–14, NFR-01–09 o las limitaciones publicadas
  del lienzo sin enmendar `mvp-spec.md`.
- Hacer unloadable un documento schema `1` válido hoy.
- Medio-implementar un `kind` (campo huérfano, paleta sin reglas, export
  que ignora el elemento).
- Sustituir el autosave del único workspace por «solo archivo» o por
  sync.
- Introducir selector de temas, webfonts o kits de iconos.
- Cambiar el pin `html-to-image@1.11.11` o TypeScript 6.0.3 sin ADR.

`schemaVersion` / `storageVersion` **no** se incrementan en este
documento. Orden de `migrate()`, rechazo y cuota:
[`schema-evolution.md`](../architecture/schema-evolution.md).

## Requisitos funcionales

Solo hay FR donde el comportamiento cabe en fuentes ya acordadas
(`mvp-spec.md`, `domain-model.md`, patrón de warnings geométricos). Un
ítem sin fuente UML o de persistencia **no** es FR: queda en el catálogo
bloqueado.

Los «P0» son candidatos de la primera wave (TASK-033 elige el
subconjunto). «P1» / «P2» no entran en ese freeze.

| ID | Requisito | Prioridad | Destino |
| --- | --- | --- | --- |
| FR-P01 | Detectar ciclos dirigidos Include y Extend y mostrarlos como **warning no bloqueante** (mismo patrón que los avisos geométricos del MVP: no impiden el commit ni mutan el documento). | P0 | In-scope |
| FR-P02 | Guías de alineación durante el drag de elementos: chrome del editor, no persistidas, no escriben historial, no aparecen en PNG/JPG. | P0 | In-scope |
| FR-P03 | Exportar e importar el documento **activo** como archivo JSON de usuario (intercambio), sin sustituir el autosave local. Envelope `arkuml-usecase-json` / `formatVersion` 1, payload schema `1`; ver `schema-evolution.md`. | P0 | In-scope |
| FR-P04 | Minimap de navegación del documento. Chrome; se excluye del raster de export como el resto del shell. | P1 | In-scope |
| FR-P05 | Copiar al portapapeles una imagen del diagrama completo, mismos techos y degradación 2x→1x que FR-12. Exporter hermano de PNG/JPG; no cambia el pin de `html-to-image`. | P1 | In-scope |
| FR-P06 | Runbook de publicación del `dist/` estático (hosting sin secrets cloud). | P1 | In-scope |
| FR-P07 | El chrome y el dominio se resuelven por `document.kind` (paleta, nodos/edges, `canConnect`, inspector, warnings, export) de modo que un tipo extra no reescriba el shell. Un documento, un kind. Ver [`diagram-kinds.md`](../architecture/diagram-kinds.md). | P1 | Más tarde |

FR-P01 no declara que un ciclo sea ilegal en UML: no hay fuente UML
acordada en el repo. El producto avisa para no rechazar diagramas que el
MVP acepta hoy (`mvp-spec.md`: los ciclos no se validan). Pasar a
bloqueo exige una fuente citada y una revisión de este contrato.

FR-P03 no es IndexedDB, no es sync y no es multi-documento. Es un
archivo que el usuario descarga o abre.

FR-P07 no es la notación de clases ni un selector de tipo en 1.x. No se
implementa el host vacío «por si acaso». Va acoplado a W17-13: el primer
`document.kind` persistido distinto de `use-case` es línea 2.0.

## Waves 12–17

Destinos: **in-scope** (catálogo activo; FR o candidato), **más tarde**
(sigue en el inventario, no en la primera wave), **exclusión** (fuera de
alcance hasta revisar este contrato). El estado de catálogo en el
roadmap es la proyección operativa.

### Fase 12 — Semántica UML

| ID | Destino | Pri. | Disposición |
| --- | --- | --- | --- |
| W12-01 | In-scope | P0 | FR-P01. Warning, no bloqueo. |
| W12-02 | Más tarde | P1 | Generalization: `domain-model.md` ya exige un `kind` de relación nuevo, no un flag. **Bloqueado** hasta decidir actores, casos o ambos con fuente UML acordada. |
| W12-03 | Más tarde | P2 | Extension points y condiciones. Bloqueado: bump de schema (`schema-evolution.md`) y W12-02. |
| W12-04 | Más tarde | P1 | Notas. Bloqueado: ¿elemento persistido u overlay? Sin inventar. |
| W12-05 | Exclusión | — | Paquetes. Choca con el boundary único del producto actual. |
| W12-06 | Exclusión | — | Multiplicidad. Stop: no hay fuente UML acordada. |
| W12-07 | Más tarde | P2 | Actores no humanos. Bloqueado: ¿nuevo `kind` o estereotipo? |

### Fase 13 — Potencia del editor

| ID | Destino | Pri. | Disposición |
| --- | --- | --- | --- |
| W13-01 | Más tarde | P1 | Waypoints persistidos. Bloqueado: bump de schema (`schema-evolution.md`) + posible addendum ADR-002. |
| W13-02 | In-scope | P0 | FR-P02. Solo chrome. |
| W13-03 | In-scope | P1 | FR-P04. |
| W13-04 | Más tarde | P2 | Auto-layout. Bloqueado: algoritmo y dependencia nueva (stop si hay paquete). |

### Fase 14 — Persistencia y documentos

| ID | Destino | Pri. | Disposición |
| --- | --- | --- | --- |
| W14-01 | Más tarde | Condicional | IndexedDB **no** elegido. Solo C-QUOTA. Política: `schema-evolution.md`. Hoy 100/150 ~95 KiB UTF-16. |
| W14-02 | Exclusión | — | Multi-documento. Un único workspace. No hay lista ni switch. |
| W14-03 | In-scope | P0 | FR-P03. Envelope `arkuml-usecase-json` (`schema-evolution.md`). Sin ADR-004. |
| W14-04 | In-scope (infra) | — | `migrate()` real. Política en `schema-evolution.md`. Código solo con el primer bump. |
| W14-05 | Exclusión | — | Sync multi-tab. Sigue last-write-wins (ADR-004). |

### Fase 15 — Exportación

| ID | Destino | Pri. | Disposición |
| --- | --- | --- | --- |
| W15-01 | Más tarde | P1 | SVG persistido / export SVG. Bloqueado: reabrir ADR-006. |
| W15-02 | Más tarde | P2 | PDF. Bloqueado: depende de W15-01 o de una decisión explícita posterior; no se elige SVG-print vs PNG embebido aquí. |
| W15-03 | In-scope | P1 | FR-P05. No exige reabrir ADR-006 si reutiliza `exportDiagram`. |
| W15-04 | Condicional | — | Markers Safari: limitación aceptada (TASK-029). Solo si C-EXPORT o un fallo **nuevo** de raster. |

### Fase 16 — Accesibilidad y plataforma

| ID | Destino | Pri. | Disposición |
| --- | --- | --- | --- |
| W16-01 | Más tarde | P1 | Estrategia SR del lienzo. Bloqueado: hace falta `accessibility.md` (o equivalente) y elegir documento paralelo vs React Flow. |
| W16-02 | Más tarde | P2 | Recorrido teclado del grafo. Depende de W16-01. |
| W16-03 | Exclusión | — | Touch / móvil. El producto sigue desktop-first. |
| W16-04 | Exclusión | — | Temas / dark / inversa. No se enmienda `brand-system.md`. La variante inversa sigue reservada, no es un selector. |
| W16-05 | Exclusión | — | Plantillas y mapa de estilos. Van con temas; no hay estilos versionados sin enmendar marca o schema. |

### Fase 17 — Escala y ecosistema

| ID | Destino | Pri. | Disposición |
| --- | --- | --- | --- |
| W17-01 | Más tarde | P1 | FR-P07. Plataforma por `document.kind`. Un documento, un kind. **Bloqueada** hasta W17-13 (fuente UML + forma persistida). Sin switcher en 1.x. |
| W17-02 | Exclusión | — | Backend, auth, colaboración, SaaS. |
| W17-03 | Exclusión | — | `DiagramRepository` remoto. |
| W17-04 | Exclusión | — | PWA. |
| W17-05 | In-scope | P1 | FR-P06. |
| W17-06 | Más tarde | — | TypeScript 7. Bloqueado: peer de typescript-eslint (ADR-001). No es FR de producto. |
| W17-07 | Exclusión | — | Husky, lint-staged, commitlint. |
| W17-08 | Condicional | — | Virtualización / Canvas / WebGL. Solo C-PERF. |
| W17-09 | Condicional | — | Motor X6 o Konva. Solo si W17-08 no basta; ADR-002. |
| W17-10 | Exclusión | — | Analytics. |
| W17-11 | Exclusión | — | SEO / SSR / Next.js. |
| W17-12 | Exclusión | — | Jest, Cypress, Vitest Browser, Tailwind, shadcn, Router. |
| W17-13 | Más tarde | P1 | Diagrama de clases (primer tipo extra). **Bloqueada**: fuente UML citada, unión de elementos/relaciones, bump de schema, addendum de marca para iconos (sin kit externo). No es FR hasta esos gates. |

### Contingencias

Sin cambio de disparador. No son FR. No se programan.

| ID | Destino |
| --- | --- |
| C-PERF | Condicional: abre W17-08; si no basta, W17-09 con ADR-002. |
| C-QUOTA | Condicional: reabrir ADR-004; entonces W14-01. Backend no elegido hasta ese gate. |
| C-EXPORT | Condicional: reabrir ADR-006 **antes** de W15-01/02. |
| C-PRIVACY | Exclusión vigente de telemetría; si alguien la pide, gate de privacidad antes de W17-10. |

## Exclusiones O-01–O-10

Disposición respecto al registro. «Entra» = catálogo activo (in-scope,
más tarde o condicional). «Permanece» = fuera de alcance vigente hasta
revisar este contrato.

| ID | Grupo | Disposición |
| --- | --- | --- |
| O-01 | UML extra y otros diagramas | **Se parte.** Entran: W12-01 (in-scope), W12-02/03/04/07 (más tarde, bloqueados), W17-01 (plataforma, más tarde / bloqueada) y W17-13 (clases, más tarde / bloqueada). Permanecen exclusión: paquetes (W12-05), multiplicidad (W12-06). |
| O-02 | Potencia del editor | **Entra.** In-scope: W13-02, W13-03. Más tarde / bloqueado: W13-01, W13-04. |
| O-03 | Multi-documento, IndexedDB, sync, remoto | **Se parte.** IndexedDB condicional (W14-01). Permanecen exclusión: multi-documento (W14-02), sync (W14-05), repo remoto (W17-03). |
| O-04 | PDF, SVG, clipboard, JSON de usuario | **Se parte.** Entran: JSON de usuario (W14-03, in-scope) y clipboard (W15-03, in-scope). Más tarde / bloqueado: SVG (W15-01), PDF (W15-02). |
| O-05 | Dark mode, temas, webfonts, animación de marca | **Permanece** exclusión (W16-04, W16-05). |
| O-06 | Editor paralelo para lector de pantalla | **Entra** como más tarde / bloqueado (W16-01, W16-02). No es FR hasta existir el documento de estrategia. |
| O-07 | Touch y edición móvil | **Permanece** exclusión (W16-03). |
| O-08 | Backend, auth, collab, analytics, SaaS, PWA | **Se parte.** Permanecen exclusión: W17-02, W17-03, W17-04, W17-10. Entra el runbook estático (W17-05), que no es SaaS. |
| O-09 | Toolchain (Husky, Jest, Cypress, Tailwind, Router, TS7) | **Se parte.** Permanecen exclusión: W17-07, W17-12. TS7 entra como más tarde / bloqueado (W17-06), no como FR. |
| O-10 | X6/Konva, Canvas/WebGL, DI, event bus, Redux | **Permanece** exclusión como trabajo programado. W17-08/09 solo por contingencia medida. DI, event bus y Redux no entran al catálogo. |

## Non-goals vigentes

No implementar, ni preparar «por si acaso», hasta una revisión explícita
de este contrato:

- Un `document.kind` distinto de `use-case` en la línea **1.x**. 1.x no
  persiste otro kind. Un tipo extra sin fuente UML acordada **no** es FR
  (W17-13 sigue bloqueada).
- Paquetes, multiplicidad, temas, plantillas, edición táctil/móvil.
- Multi-documento, sync multi-tab, workspace remoto.
- Backend, autenticación, usuarios, colaboración, PWA, analytics, SEO/SSR.
- Husky / lint-staged / commitlint como requisito.
- Jest, Cypress, Vitest Browser, Tailwind, shadcn, router de aplicación.
- DI framework-level, event bus, Redux, arquitectura ceremonial.
- Semántica UML de Generalization, notas, extension points o actores
  especializados **como FR**: siguen bloqueados, no se inventan en una
  TASK de implementación.

Preparar un `kind` discriminado o `DiagramRepository` async **no**
autoriza un segundo diagrama ni IndexedDB (igual que en el MVP). FR-P07
no se implementa como host vacío.

## ADRs que podrían reabrirse

Este contrato **no** los reabre. Solo señala cuándo una wave futura
tendría que hacerlo **antes** de tocar código.

| ADR | Reabrir si… | No reabrir si… |
| --- | --- | --- |
| [ADR-003](../decisions/ADR-003-state-management.md) | El historial deja de ser RAM-only, se persiste, o undo debe restaurar viewport/selección (R-13). | FR-P01/P02: warnings y guías no entran al historial; el tope 100 y undo-sin-viewport se conservan. |
| [ADR-004](../decisions/ADR-004-persistence.md) | C-QUOTA adelanta IndexedDB, o una revisión futura pide multi-documento. | FR-P03: archivo JSON del documento activo, sin cambiar el adapter de workspace (`schema-evolution.md`). Sync multi-tab sigue fuera. W17-01/13: un documento, un kind; no es lista de diagramas. |
| [ADR-006](../decisions/ADR-006-export.md) | C-EXPORT, fallo nuevo de raster, o W15-01/02 (SVG/PDF). | FR-P05 si es exporter hermano que reutiliza `exportDiagram` y el pin `1.11.11`. Markers Safari ya aceptados. |

ADR-001 (TS7 / hooks Git) y ADR-002 (waypoints, auto-layout, X6) siguen
el mismo criterio: se reabren en la TASK que los necesite, no aquí.
W17-13 puede exigir addendum de ADR-002 y de `brand-system.md` **antes**
de código; no se reabren en esta revisión.

## Primera wave (recomendación a TASK-033)

Nombre tentativo: **Editor local sobre schema 1**.

Candidatos maduros (decisiones de producto cerradas; sin UML inventado):

1. W12-01 / FR-P01 — ciclos como warning.
2. W13-02 / FR-P02 — guías de alineación.

Candidatos P0/P1 con política de persistencia ya escrita
([`schema-evolution.md`](../architecture/schema-evolution.md)):

- W14-03 / FR-P03 — JSON de usuario (envelope cerrado; sin ADR-004).
- W15-03 / FR-P05 — clipboard (P1; no exige schema).

TASK-033 elige el subconjunto y crea `TASK-034+` solo para ítems `Lista`.
No congela la fase 12–17 entera.

## Segunda wave (TASK-037, 2026-09-09)

Nombre: **Intercambio y distribución sobre schema 1**. Schema `1`. Sin ADR.

1. W14-03 / FR-P03 — JSON de usuario (envelope cerrado).
2. W13-03 / FR-P04 — minimap (chrome).
3. W15-03 / FR-P05 — clipboard de imagen.
4. W17-05 / FR-P06 — runbook estático.

W17-01 y W17-13 siguen más tarde / bloqueadas. Esta wave no es un
segundo tipo de diagrama.

## Fuera de este contrato

- Código de la Wave 2 (eso es TASK-038–041).
- Pins, schema `1` del árbol `src/` salvo lo que cada TASK de la wave
  autorice en chrome/I/O.
- Implementar `migrate()`, IndexedDB o un segundo `document.kind`.
- Archivos `TASK-042+` o un freeze nuevo.
- Reabrir o enmendar ADRs.
- Inventar el metamodelo de clases.
