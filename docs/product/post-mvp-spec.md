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
freeze (como TASK-033, TASK-037, TASK-045 o TASK-051) es la única que
puede promover un subconjunto maduro a TASK ejecutables. Hasta un freeze
no hay Generalization en casos de uso, IndexedDB, PDF, temas ni un tipo
a medias (regla TASK-020). TASK-045 congeló **Release 1** (línea 2.0).
TASK-051 congeló **Release 2** (línea 3.0).

## Resumen

ArkUML en **1.x** permanece una SPA desktop-first de **casos de uso**,
local, un usuario, sin SaaS. El ciclo **Release 1** abre la línea
**2.0**: biblioteca local de documentos y `document.kind` `"sequence"`
(subconjunto cerrado). El ciclo **Release 2** abre la línea **3.0**:
seis kinds más (clases, componentes, despliegue, ER Chen, actividades,
interacción general), cada uno con metamodelo cerrado y módulo completo.
No es un producto en la nube. Los seis no aterrizan en un solo chat.

Supuestos que **no** cambian hasta una revisión explícita de este
contrato:

- 1.x: un único documento local activo. **2.0 (Release 1):** biblioteca
  local en el mismo autosave ([ADR-007](../decisions/ADR-007-workspace-library.md)).
  Un documento, un `kind`. No hay sync ni workspace remoto.
- Kind `use-case`: un único `SystemBoundary` por documento. Secuencia:
  [`sequence-model.md`](../architecture/sequence-model.md). Release 2:
  un metamodelo por kind (ver FR-R04–R09). Un documento, un `kind`.
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
| Producto | Promesa al usuario (SemVer de distribución) | MVP shipped (TASK-030) = línea **1.x** (tag **1.0.0**). **Release 1** = línea **2.0** (tag **2.0.0**). **Release 2** = línea **3.0** (tag **3.0.0** cuando TASK-052–063 estén `Hecha`). `package.json` sigue `0.0.0` hasta un tag explícito; este contrato no lo cambia. |
| `schemaVersion` | Forma de `DiagramDocument` | `2` vigente en `src/` (Release 1). Release 2 autoriza `3`. |
| `storageVersion` | Envelope de `WorkspaceSnapshot` | `2` vigente (ADR-007). Release 2 **no** lo sube. |

Línea **1.x** = schema `1`. Línea **2.x** = schema `2` (secuencia +
biblioteca). Línea **3.x** = schema `3` (kinds de Release 2). Un cliente
2.0 que encuentre schema `3` lo trata como `PARSE_INVALID` / `UNKNOWN_KIND`.

### Qué es patch, minor y major

| SemVer | Ejemplos | Schema / storage |
| --- | --- | --- |
| Patch `1.0.x` | Defectos, copy, a11y del chrome ya especificado, pulido que no añade FR | Siguen `1` / `1` |
| Minor `1.x.0` | FR Post-MVP **aditivos** que un documento schema `1` sigue abriendo en 1.0 (solo chrome, warnings, o archivo JSON del mismo documento) | Schema `1`. Campos persistidos nuevos no entran: `strictObject` los haría unloadable en 1.0 (`schema-evolution.md`). `storageVersion` solo sube si cambia el envelope, no el documento |
| Major `2.0.0` | Primer `document.kind` distinto de `use-case` (secuencia); biblioteca local | `schemaVersion` 2, `storageVersion` 2 |
| Major `3.0.0` | Kinds de Release 2 (W17-13, W17-15–19); `formatVersion` 3 | `schemaVersion` 3; `storageVersion` sigue 2 |

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

`schemaVersion` / `storageVersion` se incrementan **solo** con el freeze
que los autoriza. Release 1 autoriza `2` / `2`. Release 2 autoriza
schema `3` (storage sigue `2`). Orden de `migrate()`, rechazo y cuota:
[`schema-evolution.md`](../architecture/schema-evolution.md).

## Requisitos funcionales

Solo hay FR donde el comportamiento cabe en fuentes ya acordadas
(`mvp-spec.md`, `domain-model.md`, patrón de warnings geométricos). Un
ítem sin fuente UML o de persistencia **no** es FR: queda en el catálogo
bloqueado.

Los «P0» de cada freeze los elige esa TASK (033, 037, 045, 051). «P1» /
«P2» no entran salvo que el freeze los nombre.

| ID | Requisito | Prioridad | Destino |
| --- | --- | --- | --- |
| FR-P01 | Detectar ciclos dirigidos Include y Extend y mostrarlos como **warning no bloqueante** (mismo patrón que los avisos geométricos del MVP: no impiden el commit ni mutan el documento). | P0 | In-scope |
| FR-P02 | Guías de alineación durante el drag de elementos: chrome del editor, no persistidas, no escriben historial, no aparecen en PNG/JPG. | P0 | In-scope |
| FR-P03 | Exportar e importar el documento **activo** como archivo JSON de usuario (intercambio), sin sustituir el autosave local. 1.x: `arkuml-usecase-json` / `formatVersion` 1. Release 1: `arkuml-document-json` / `formatVersion` 2. Release 2: mismo `format`, `formatVersion` 3, payload schema `3`. Archivos 1.x/2.x siguen importables vía `migrate()`. Ver `schema-evolution.md`. | P0 | In-scope |
| FR-P04 | Minimap de navegación del documento. Chrome; se excluye del raster de export como el resto del shell. | P1 | In-scope |
| FR-P05 | Copiar al portapapeles una imagen del diagrama completo, mismos techos y degradación 2x→1x que FR-12. Exporter hermano de PNG/JPG; no cambia el pin de `html-to-image`. | P1 | In-scope |
| FR-P06 | Runbook de publicación del `dist/` estático (hosting sin secrets cloud). | P1 | In-scope |
| FR-P07 | El chrome y el dominio se resuelven por `document.kind` (paleta, nodos/edges, `canConnect`, inspector, warnings, export) de modo que un tipo extra no reescriba el shell. Un documento, un kind. Ver [`diagram-kinds.md`](../architecture/diagram-kinds.md). | P0 | In-scope (Release 1) |
| FR-R01 | Biblioteca local: varios `DiagramDocument` en un `WorkspaceSnapshot` (`storageVersion` 2), un activo. Autosave único. Ver [ADR-007](../decisions/ADR-007-workspace-library.md). | P0 | In-scope (Release 1) |
| FR-R02 | Combobox en la top bar para activar un documento de la biblioteca; al abrirlo, búsqueda por título. Chrome; no persiste la consulta. | P0 | In-scope (Release 1) |
| FR-R03 | Diagrama de secuencia (`document.kind` `"sequence"`): subconjunto de [`sequence-model.md`](../architecture/sequence-model.md) (lifeline, mensaje síncrono, reply). | P0 | In-scope (Release 1) |
| FR-R04 | Diagrama de clases (`"class"`): [`class-model.md`](../architecture/class-model.md). | P0 | In-scope (Release 2) |
| FR-R05 | Diagrama de componentes (`"component"`): [`component-model.md`](../architecture/component-model.md). | P0 | In-scope (Release 2) |
| FR-R06 | Diagrama de despliegue (`"deployment"`): [`deployment-model.md`](../architecture/deployment-model.md). | P0 | In-scope (Release 2) |
| FR-R07 | Diagrama entidad-relación Chen (`"entity-relationship"`): [`er-model.md`](../architecture/er-model.md); [ADR-008](../decisions/ADR-008-chen-er.md). | P0 | In-scope (Release 2) |
| FR-R08 | Diagrama de actividades (`"activity"`): [`activity-model.md`](../architecture/activity-model.md). | P0 | In-scope (Release 2) |
| FR-R09 | Diagrama de interacción general (`"interaction-overview"`): [`interaction-overview-model.md`](../architecture/interaction-overview-model.md). `ref` por nombre, no por id de biblioteca. | P0 | In-scope (Release 2) |

FR-P01 no declara que un ciclo sea ilegal en UML: no hay fuente UML
acordada en el repo. El producto avisa para no rechazar diagramas que el
MVP acepta hoy (`mvp-spec.md`: los ciclos no se validan). Pasar a
bloqueo exige una fuente citada y una revisión de este contrato.

FR-P03 no es IndexedDB, no es sync. En 1.x no era multi-documento: era un
archivo del documento activo. En 2.0 el archivo sigue siendo **un**
documento (el activo); la biblioteca no se exporta como un único blob
público.

FR-P07 no es un selector de tipo en 1.x. No se implementa el host vacío
«por si acaso». En Release 1 va acoplado a W17-14. En Release 2, cada
FR-R04–R09 lleva su par dominio/chrome.

FR-R01/R02 no son IndexedDB ni sync. FR-R03 no incluye fragmentos ni
mensajes async. FR-R04–R09 no se implementan en un solo chat: cada kind
tiene TASK de dominio y TASK de chrome; «Nuevo» no lista un kind sin
módulo. FR-R07 no es UML. FR-R09 no embebe una secuencia ni resuelve
`ref` a otro documento.

## Waves 12–17

Destinos: **in-scope** (catálogo activo; FR o candidato), **más tarde**
(sigue en el inventario, no en la primera wave), **exclusión** (fuera de
alcance hasta revisar este contrato). El estado de catálogo en el
roadmap es la proyección operativa.

### Fase 12 — Semántica UML

| ID | Destino | Pri. | Disposición |
| --- | --- | --- | --- |
| W12-01 | In-scope | P0 | FR-P01. Warning, no bloqueo. |
| W12-02 | Más tarde / parcial R2 | P1 | Generalization **entre clases** (FR-R04, `class-model.md`). **Bloqueado** en casos de uso hasta fuente UML para actores/casos. |
| W12-03 | Más tarde | P2 | Extension points y condiciones. Bloqueado: bump de schema (`schema-evolution.md`) y W12-02 de use-case. |
| W12-04 | Más tarde | P1 | Notas. Bloqueado: ¿elemento persistido u overlay? Sin inventar. |
| W12-05 | Exclusión | — | Paquetes. Choca con el boundary único de casos de uso. |
| W12-06 | Exclusión / parcial R2 | — | Multiplicidad **en casos de uso**: exclusión. Release 2 levanta solo extremos de clase (`"0..1"\|"1"\|"0..*"\|"1..*"`) y cardinalidad Chen `"1"\|"N"`. |
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
| W14-02 | In-scope | P0 | Biblioteca local. FR-R01. ADR-007. Un workspace, varios documentos. |
| W14-03 | In-scope | P0 | FR-P03. Envelope `arkuml-usecase-json` (`schema-evolution.md`). Sin ADR-004. |
| W14-04 | In-scope (infra) | — | `migrate()` real. Política: `schema-evolution.md`. Código en Release 1 (TASK-046/047) antes del primer save 2.0. |
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
| W17-01 | In-scope | P0 | FR-P07. Plataforma por `document.kind`. Un documento, un kind. Release 1: acoplada a W17-14. Host vacío prohibido. |
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
| W17-13 | In-scope | P0 | Diagrama de clases. FR-R04. Fuente UML 2.5.1 §9/§11; subconjunto en `class-model.md`. Release 2. |
| W17-14 | In-scope | P0 | Diagrama de secuencia. FR-R03. Fuente UML 2.5.1 §17; subconjunto en `sequence-model.md`. |
| W17-15 | In-scope | P0 | Diagrama de componentes. FR-R05. `component-model.md`. Release 2. |
| W17-16 | In-scope | P0 | Diagrama de despliegue. FR-R06. `deployment-model.md`. Release 2. |
| W17-17 | In-scope | P0 | Entidad-relación Chen. FR-R07. `er-model.md`; ADR-008. Release 2. |
| W17-18 | In-scope | P0 | Diagrama de actividades. FR-R08. `activity-model.md`. Release 2. |
| W17-19 | In-scope | P0 | Interacción general. FR-R09. `interaction-overview-model.md` (UML 2.5.1 §17.9). Release 2. |

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
| O-01 | UML extra y otros diagramas | **Se parte.** Entran: W12-01; W17-01/14 (Release 1); W17-13 y W17-15–19 (Release 2). W12-02/06: solo clases/ER en R2; use-case sigue bloqueado/exclusión. Crow’s foot exclusión. Permanecen exclusión: paquetes (W12-05). Más tarde: W12-03/04/07. |
| O-02 | Potencia del editor | **Entra.** In-scope: W13-02, W13-03. Más tarde / bloqueado: W13-01, W13-04. |
| O-03 | Multi-documento, IndexedDB, sync, remoto | **Se parte.** Entra: multi-documento local (W14-02, Release 1). IndexedDB condicional (W14-01). Permanecen exclusión: sync (W14-05), repo remoto (W17-03). |
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

- Un `document.kind` distinto de `use-case` en la línea **1.x**. En
  **2.0** el extra autorizado es secuencia (W17-14). En **3.0** los
  extras son FR-R04–R09, cada uno con módulo completo (TASK-052–063).
- Paquetes, multiplicidad de **casos de uso**, temas, plantillas, Crow’s
  foot, edición táctil/móvil.
- Sync multi-tab, workspace remoto. IndexedDB hasta C-QUOTA.
- Backend, autenticación, usuarios, colaboración, PWA, analytics, SEO/SSR.
- Husky / lint-staged / commitlint como requisito.
- Jest, Cypress, Vitest Browser, Tailwind, shadcn, router de aplicación.
- DI framework-level, event bus, Redux, arquitectura ceremonial.
- Semántica UML de Generalization **en casos de uso**, notas, extension
  points o actores especializados **como FR**.
- Fragmentos combinados, mensajes async, activaciones persistidas u
  otros conceptos fuera de `sequence-model.md`.
- Interaction inline, `ref` a otro `DiagramDocument`, entidad débil Chen.

Preparar un `kind` discriminado o `DiagramRepository` async **no**
autoriza IndexedDB ni un kind a medias. FR-P07 no se implementa como
host vacío: cada kind extra tiene TASK de dominio y de chrome.

## ADRs que podrían reabrirse

TASK-045 **acepta** ADR-007 (biblioteca) y el addendum de historial en
ADR-003. El resto no se reabre aquí. La tabla señala cuándo una wave
futura tendría que hacerlo **antes** de tocar código.

| ADR | Reabrir si… | No reabrir si… |
| --- | --- | --- |
| [ADR-003](../decisions/ADR-003-state-management.md) | El historial deja de ser RAM-only, se persiste, o undo debe restaurar viewport/selección (R-13). | FR-P01/P02: warnings y guías no entran al historial; el tope 100 y undo-sin-viewport se conservan. |
| [ADR-004](../decisions/ADR-004-persistence.md) | C-QUOTA adelanta IndexedDB. | FR-P03: archivo JSON del documento activo. Sync multi-tab sigue fuera. W17-01/14: un documento, un kind; la **lista** es ADR-007 (Release 1), no un repo remoto. |
| [ADR-007](../decisions/ADR-007-workspace-library.md) | (Aceptada en TASK-045.) Biblioteca local. | No cubre IndexedDB ni sync. |
| [ADR-006](../decisions/ADR-006-export.md) | C-EXPORT, fallo nuevo de raster, o W15-01/02 (SVG/PDF). | FR-P05 si es exporter hermano que reutiliza `exportDiagram` y el pin `1.11.11`. Markers Safari ya aceptados. |
| [ADR-002](../decisions/ADR-002-diagram-engine.md) | Segundo motor (X6/Konva) o waypoints persistidos (W13-01). | Addendum TASK-051: proyección custom (compartimentos, prisma, Chen, marcos `ref`) **sin** cambiar de motor. |
| [ADR-008](../decisions/ADR-008-chen-er.md) | (Aceptada en TASK-051.) ER Chen. | Crow’s foot; class-as-ER. |

ADR-001 (TS7 / hooks Git) se reabre en la TASK que lo necesite, no aquí.

## Primera wave (TASK-033)

Nombre: **Editor local sobre schema 1**.

Candidatos maduros (decisiones de producto cerradas; sin UML inventado):

1. W12-01 / FR-P01 — ciclos como warning.
2. W13-02 / FR-P02 — guías de alineación.

Candidatos P0/P1 con política de persistencia ya escrita
([`schema-evolution.md`](../architecture/schema-evolution.md)):

- W14-03 / FR-P03 — JSON de usuario (envelope cerrado; sin ADR-004).
- W15-03 / FR-P05 — clipboard (P1; no exige schema).

TASK-033 eligió el subconjunto y creó `TASK-034+` solo para ítems `Lista`.
No congeló la fase 12–17 entera.

## Segunda wave (TASK-037, 2026-09-09)

Nombre: **Intercambio y distribución sobre schema 1**. Schema `1`. Sin ADR.

1. W14-03 / FR-P03 — JSON de usuario (envelope cerrado).
2. W13-03 / FR-P04 — minimap (chrome).
3. W15-03 / FR-P05 — clipboard de imagen.
4. W17-05 / FR-P06 — runbook estático.

W17-01 y W17-13 quedaron más tarde / bloqueadas. Esta wave no fue un
segundo tipo de diagrama.

## Release 1 (TASK-045, 2026-09-14)

Nombre: **Biblioteca local y diagrama de secuencia (schema 2)**. Línea
de producto **2.0**. No es el tag `1.0.0` del MVP.

1. W14-04 — `migrate()` `1→2` (documento y workspace).
2. W14-02 / FR-R01 — biblioteca local (ADR-007).
3. FR-R02 — combobox + búsqueda.
4. W17-01 / FR-P07 — plataforma por kind (sin host vacío).
5. W17-14 / FR-R03 — secuencia (subconjunto citado).
6. FR-P03 extendido — envelope `arkuml-document-json` / `formatVersion` 2.

W17-13 clases sigue bloqueada. IndexedDB no. Sin fragmentos de secuencia.

TASK-045 crea `TASK-046`–`TASK-050` solo para ítems `Lista`.

## Release 2 (TASK-051, 2026-09-14)

Nombre: **Seis kinds (schema 3)**. Línea de producto **3.0**. No es el
tag `2.0.0` de Release 1. `storageVersion` permanece 2.

1. W17-13 / FR-R04 — clases (`class-model.md`).
2. W17-15 / FR-R05 — componentes (`component-model.md`).
3. W17-16 / FR-R06 — despliegue (`deployment-model.md`).
4. W17-17 / FR-R07 — ER Chen (`er-model.md`, ADR-008).
5. W17-18 / FR-R08 — actividades (`activity-model.md`).
6. W17-19 / FR-R09 — interacción general (`interaction-overview-model.md`).
7. FR-P03 extendido — `formatVersion` 3.
8. W14-04 — `migrateDocument` `2→3`.

Orden de implementación: estructurales y luego comportamentales. Unión
Zod aditiva. Host vacío prohibido.

TASK-051 crea `TASK-052`–`TASK-063` solo para ítems `Lista`.

## Fuera de este contrato

- Código de Release 1 (TASK-046–050) y de Release 2 (TASK-052–063).
- Pins. El árbol `src/` permanece schema `2` / storage `2` hasta TASK-052+.
- IndexedDB, PDF, temas, Crow’s foot, fragmentos de secuencia, Interaction
  inline, Generalization en casos de uso.
- Reabrir ADR-006. Reabrir ADR-002 como segundo motor (el addendum de
  proyección ya está en TASK-051).
