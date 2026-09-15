# Evolución de schema y storage

Política canónica de cómo evoluciona el documento persistido. No autoriza
código. El schema `1` del MVP no cambia aquí.

`mvp-spec.md` gana para el producto actual. Los ADRs vigentes ganan hasta
que una TASK futura los reabra **antes** de tocar `src/persistence`.
El contrato de alcance Post-MVP está en
[`post-mvp-spec.md`](../product/post-mvp-spec.md). Cómo se añade un
`document.kind` está en [`diagram-kinds.md`](diagram-kinds.md).

## Números vigentes

Tres números distintos. No se sustituyen entre sí.

| Número | Identifica | Valor actual | Dónde vive |
| --- | --- | --- | --- |
| Producto | Promesa al usuario (SemVer de distribución) | MVP 1.x; Release 1 = 2.0 (tag **2.0.0**); Release 2 = 3.0 (tag **3.0.0**) | `post-mvp-spec.md` |
| `schemaVersion` | Forma de `DiagramDocument` | `2` en `src/` (Release 1). Release 2 autoriza `3` | Documento |
| `storageVersion` | Envelope de `WorkspaceSnapshot` | `2` (ADR-007). Release 2 no lo sube | Snapshot de workspace |

Clave de workspace: `arkuml:workspace:v1` ([ADR-004](../decisions/ADR-004-persistence.md)).
En 1.x: un único documento. En 2.0: biblioteca
([ADR-007](../decisions/ADR-007-workspace-library.md)). Historial
(máximo 100 snapshots de `DiagramDocument` por id) solo en RAM.

`z.strictObject` rechaza claves desconocidas. El MVP solo acepta
`schemaVersion` `1` y `storageVersion` `1`. Release 1 implementa
`migrate()` `1→2` **antes** del primer save 2.0 (TASK-046/047). JSON
corrupto o versión distinta no soportada es `PARSE_INVALID`: no se
sobrescribe hasta «Comenzar limpio».

## Qué es un bump

### `schemaVersion`

Sube **antes** de persistir cualquier cambio de forma de
`DiagramDocument`. Ejemplos:

- Campo nuevo, obligatorio u opcional, en documento, elemento o relación.
- Quitar o renombrar un campo.
- Cambiar el tipo o el significado de un campo existente.
- Nuevo `kind` de elemento o relación (Generalization, notas persistidas,
  extension points, actores con `kind` nuevo).
- `document.kind` distinto de `use-case` (Release 1: secuencia,
  W17-14; Release 2: FR-R04–R09, schema 3).
- Geometría persistida que hoy no existe (waypoints en el documento).
- Cambiar la matriz de conexión de forma incompatible.

No sube por chrome, copy, avisos no persistidos ni export raster.

Consecuencia de producto ([post-mvp-spec.md](../product/post-mvp-spec.md)):
un bump de `schemaVersion` a 2 es línea **2.0**; a 3 es línea **3.0**.
La línea **1.x** permanece en schema `1`.

`strictObject` impide el atajo «campo opcional con default en 1.x»: un
documento con claves nuevas es rechazado por el parser 1.0. Esa adición
**no** es minor compatible. O no se persiste, o se bumpa el schema.

### `storageVersion`

Sube cuando cambia la forma de `WorkspaceSnapshot` (campos del envelope,
no del documento). Independiente de `schemaVersion`.

No sube solo por cambiar el backend si el JSON del snapshot es el mismo.
IndexedDB con el mismo `WorkspaceSnapshot` seguiría en `storageVersion`
`1`; el cambio de backend es ADR-004, no un bump de envelope.

La clave `arkuml:workspace:v1` no se renombra mientras `storageVersion`
sea `1`. Un bump de envelope o bien migra in-place en esa clave, o bien
usa clave nueva y borra la anterior **después** de un save exitoso. Nunca
dos workspaces vivos.

### Producto 1.x vs 2.0 vs 3.0

| Línea | Persistencia |
| --- | --- |
| Patch `1.0.x` | Schema `1` / storage `1`. Defectos, copy, a11y ya especificada. |
| Minor `1.x.0` | Schema `1`. FR aditivos **no persistidos** (chrome, warnings) o I/O de archivo sobre el mismo documento. `storageVersion` solo sube si cambia el envelope, no el documento. |
| Major `2.0.0` | `schemaVersion` 2, `storageVersion` 2. Release 1: secuencia, biblioteca. |
| Major `3.0.0` | `schemaVersion` 3; `storageVersion` 2. Release 2: FR-R04–R09; `formatVersion` 3. `migrateDocument` `2→3` antes del primer save 3. |

## Qué es breaking

Breaking para un lector schema `1` (el MVP y toda la línea 1.x):

- Hacer unloadable un `DiagramDocument` schema `1` válido hoy.
- Cualquier clave persistida que `strictObject` no conozca.
- Dejar de cargar schema `1` sin `migrate()`.
- Cambiar `kind: "use-case"` del documento, o la matriz Actor / UseCase /
  Include / Extend del MVP, de forma que un diagrama 1.0 deje de ser
  válido.
- Persistir un `document.kind` que el parser 1.0 no conoce (el 1.0 lo
  trata como `UNKNOWN_KIND`).
- Persistir selección, historial, herramienta u objetos de React Flow.

No es breaking:

- FR-P01 (ciclos como warning), FR-P02 (guías), FR-P04 (minimap): no
  escriben el documento ni el historial.
- FR-P03 (JSON de usuario) si el archivo es el envelope de abajo y el
  payload es schema `1`.
- FR-P05 (clipboard de imagen): no toca persistencia.
- Fallo de cuota o storage bloqueado: el trabajo sigue en memoria
  (NFR-07).

Waypoints, estilos, extension points, notas y Generalization **en casos
de uso** no tienen forma persistida aquí. Secuencia Release 1:
[`sequence-model.md`](sequence-model.md). Release 2: cada kind tiene
`*-model.md`. Inventar esa forma en una TASK de implementación es stop.

FR-P07 (plataforma por `kind`) no bumpa solo: el host vacío no se
persiste. El primer `document.kind` extra (secuencia) es el bump de
Release 1. Los seis de Release 2 son el bump a schema 3 (unión aditiva;
ver [`diagram-kinds.md`](diagram-kinds.md)).

## Envelope público (FR-P03)

Intercambio de **archivo**, no el adapter de workspace. No sustituye el
autosave. No es IndexedDB, no es sync. No exporta la biblioteca entera.

### 1.x (`formatVersion` 1)

```text
ArkUmlDocumentFile
├─ format: "arkuml-usecase-json"
├─ formatVersion: 1
├─ document: DiagramDocument   (schemaVersion 1, kind use-case)
└─ view: { x, y, zoom }
```

Reglas 1.x (siguen vigentes para abrir archivos antiguos):

- `format` y `formatVersion` identifican el archivo. No se reutiliza
  `storageVersion`.
- Un blob de localStorage (`WorkspaceSnapshot`) **no** es el formato
  público.

### 2.x (Release 1, `formatVersion` 2)

```text
ArkUmlDocumentFile
├─ format: "arkuml-document-json"
├─ formatVersion: 2
├─ document: DiagramDocument   (schemaVersion 2, kind use-case | sequence)
└─ view: { x, y, zoom }
```

- **No** se reutiliza `arkuml-usecase-json` para secuencia ni para
  schema 2.
- Exportar: serializar el documento **activo** y su viewport.
- Importar: validar → `migrateDocument` si el archivo es 1.x → **añadir**
  a la biblioteca y activar (ADR-007). No sustituye los demás.
- Si el archivo es `arkuml-usecase-json` / `formatVersion` 1: migrar
  `1→2` y añadir.
- Rechazo (no se escribe el workspace): JSON inválido; `format`
  desconocido; `formatVersion` no soportado; claves de más; `kind`
  desconocido; secuencia dentro de `arkuml-usecase-json`.

### 3.x (Release 2, `formatVersion` 3)

```text
ArkUmlDocumentFile
├─ format: "arkuml-document-json"
├─ formatVersion: 3
├─ document: DiagramDocument   (schemaVersion 3, kind de la unión 3.0)
└─ view: { x, y, zoom }
```

- Mismo `format` que 2.x; **no** se reutiliza `arkuml-usecase-json`.
- La unión de `kind` crece con cada TASK de dominio. Un archivo 3.x con
  un kind aún no en la unión es `UNKNOWN_KIND`.
- Importar 1.x: `migrate` `1→2→3`. Importar 2.x: `2→3`. Añadir a la
  biblioteca (ADR-007).
- Implementación: TASK-052 introduce `formatVersion` 3 con `"class"`;
  TASK-054+ solo amplían la unión.

Implementación (TASK-050): `src/domain/diagram/documentFile.ts` serializa
el envelope 2.x del documento activo y su viewport. Importar valida con
Zod estricto, llama `migrateDocument` si el archivo es 1.x, y **añade**
el resultado a la biblioteca (ADR-007). Un id que ya esté en la lista
recibe uno nuevo para no destruir el anterior. El autosave sigue siendo
el snapshot v2; un blob de localStorage no es este archivo.

Este I/O no cambia `DiagramRepository`. No reabre ADR-004 (sí usa
ADR-007 para la cardinalidad de la lista).

## `migrate()`

Infraestructura, no FR de usuario. Obligatorio **antes** del primer bump
que se persista. Release 1 implementa `1→2`. Release 2 implementa
`2→3` (TASK-052). Encadenar: `1→2`, luego `2→3`. Nunca `3→1`.

Orden:

1. `JSON.parse`. Fallo → `PARSE_INVALID`; no migrar; no sobrescribir.
2. Leer `storageVersion` y `schemaVersion` por inspección, sin exigir aún
   el schema actual.
3. Versión desconocida o mayor que la soportada → rechazo (abajo).
4. Encadenar migraciones enteras, en orden, sin saltos: `1→2`, luego
   `2→3`. Nunca `3→1`. Nunca un `migrateToLatest` opaco.
5. Validar el resultado con Zod del schema **destino**. Falla →
   `PARSE_INVALID`; no persistir el intento.
6. El resultado vive en memoria y se persiste como workspace 2.0 en el
   primer hydrate (Release 1, TASK-047): la biblioteca tiene que poder
   crecer (nuevo diagrama, secuencia) sin un diálogo que bloquee el
   save. Si ese write falla (cuota / storage), se pide confirmación y el
   blob 1.0 permanece. No hay dual-write de schema `1` y `2`. Un envelope
   de un solo `document` + `view` etiquetado `storageVersion: 2` se
   envuelve como lista de un elemento; no se trata como corrupto.

Dónde vive el código cuando exista:

| Cambio | Módulo | Por qué |
| --- | --- | --- |
| `schemaVersion` (forma del documento) | Función pura en `src/domain` | El dominio no importa storage |
| `storageVersion` (envelope del snapshot) | `src/persistence` | Conoce la clave y el adapter |
| Backend (localStorage → IndexedDB) | Nueva implementación de `DiagramRepository` | ADR-004 reabierto antes |

`src/domain` no importa `localStorage`, IndexedDB ni el repository.

## Rechazo de documentos desconocidos

Mismo contrato que el MVP: visible, no silencioso, no destructivo.

| Entrada | Comportamiento |
| --- | --- |
| JSON malformado | `PARSE_INVALID`. Clave intacta. Diálogo de recuperación. |
| `schemaVersion` o `storageVersion` ≠ soportada | Igual que corrupto. No hay migrate «hacia adelante» ni strip de campos. |
| Claves de más (`strictObject`) | `PARSE_INVALID`. |
| `kind` desconocido | `UNKNOWN_KIND` / `PARSE_INVALID`. El `default` de la unión falla cerrado. |
| Storage bloqueado | `STORAGE_UNAVAILABLE`. Edición en memoria. |
| Cuota | Abajo. |

El blob dañado no se pisa hasta que el usuario confirma «Comenzar
limpio». Continuar en memoria no desbloquea el overwrite.

Una app 1.0 que encuentra schema `2` en la clave lo trata como corrupto.
Una app 2.0 que encuentra schema `3` igual. Eso es correcto: cada major
es ruptura. No se parchea el parser anterior para aceptar claves futuras.

## Cuota y localStorage lleno

Vigente (ADR-004, NFR-07):

- `QuotaExceededError` es visible (`QUOTA_EXCEEDED`).
- La edición en memoria continúa.
- No se borra el último save bueno para «hacer sitio».
- No se recorta viewport, elementos ni historial (el historial no está
  en storage).
- IndexedDB **no** se elige ahora. El escenario 100/150 mide ~95 KiB
  UTF-16; 200/300 ~191 KiB; el umbral de ADR-004 es acercarse a 1 MiB de
  forma habitual ([performance.md](performance.md)).

C-QUOTA (disparador, no FR): JSON habitual cerca de 1 MiB **o** fallos
de cuota reales. Entonces:

1. Reabrir **ADR-004** (obligatorio).
2. Recién entonces implementar W14-01 (`DiagramRepository` IndexedDB).
3. El snapshot puede seguir en `storageVersion` `1` si el JSON no cambia.

Hasta C-QUOTA, W14-01 permanece condicional. No se adelanta «por si
acaso». Cuando exista FR-P03, descargar el JSON de usuario es la copia
de escape si el save falla; no sustituye el aviso de cuota.

## ADRs: reabrir / no reabrir

La primera wave (W12-01 + W13-02) no reabrió ADRs. TASK-045 acepta
ADR-007 y el addendum de historial en ADR-003. IndexedDB sigue exigiendo
reabrir ADR-004 **antes** de código.

| ADR | ¿Reabrir? | Motivo |
| --- | --- | --- |
| [ADR-004](../decisions/ADR-004-persistence.md) | **Sí, antes de código**, si C-QUOTA adelanta IndexedDB. | Cambia el backend. |
| ADR-004 | **Addendum en TASK-045 / ADR-007.** | Cardinalidad: lista de documentos en 2.0. LocalStorage se conserva. |
| ADR-004 | **No** para FR-P03 / W14-03. | Archivo del documento activo. |
| ADR-004 | **No** para W14-05. | Sync multi-tab sigue last-write-wins; exclusión vigente. |
| [ADR-007](../decisions/ADR-007-workspace-library.md) | Aceptada. | Biblioteca; no IndexedDB. |
| [ADR-003](../decisions/ADR-003-state-management.md) | **Sí, antes de código**, si el historial deja de ser RAM-only, se persiste, o undo debe restaurar viewport/selección. Addendum Release 1: pila por `document.id` (ADR-007). | Hoy: pila 100 en RAM; undo no restaura viewport. |
| ADR-003 | **No** para FR-P01/P02/P04 ni para FR-P03. | Warnings, guías y minimap no entran al historial; el JSON de usuario no serializa la pila. |
| [ADR-006](../decisions/ADR-006-export.md) | **No** en esta política. | Export de imagen. Se reabre solo por C-EXPORT o W15-01/02. |
| ADR-001 / ADR-002 | **Addendum TASK-051** (proyección). **Sí, antes de código** si segundo motor o W13-01. | Release 2 no cambia de motor. |
| [ADR-008](../decisions/ADR-008-chen-er.md) | Aceptada. | ER Chen; no Crow’s foot. |
| ADR-004 | **No** para W17-01/14 como «lista = remoto». | Un documento, un kind. La lista es ADR-007. |

Quien toque `src/persistence` por IndexedDB **para** y reabre ADR-004.
Quien persista el historial **para** y abre ADR-003. La biblioteca 2.0
ya está decidida en ADR-007; no se reabre ADR-004 para «otra clave por
diagrama».

## Fase 14 (disposición)

| ID | Destino tras esta política |
| --- | --- |
| W14-01 IndexedDB | Condicional C-QUOTA. Backend no elegido. ADR-004 primero. |
| W14-02 Multi-documento | In-scope Release 1. ADR-007. No es IndexedDB. |
| W14-03 JSON de usuario | Autorizado. 1.x / 2.x / 3.x: envelopes arriba. |
| W14-04 `migrate()` | Política publicada. `1→2` en Release 1; `2→3` en TASK-052. |
| W14-05 Sync multi-tab | Exclusión vigente. Last-write-wins. |

## Fuera de esta política

- Código en `src/` (TASK-046, 047, 050, 052+).
- Forma persistida fuera de cada `*-model.md`.
- Fragmentos de secuencia, Crow’s foot, Interaction inline.
- Reabrir ADR-006. Segundo motor (ADR-002).
