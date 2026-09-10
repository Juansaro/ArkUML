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
| Producto | Promesa al usuario (SemVer de distribución) | MVP shipped; primer tag `1.0.0` | `post-mvp-spec.md` |
| `schemaVersion` | Forma de `DiagramDocument` | `1` | Documento |
| `storageVersion` | Envelope de `WorkspaceSnapshot` | `1` | Snapshot de workspace |

Clave de workspace: `arkuml:workspace:v1` ([ADR-004](../decisions/ADR-004-persistence.md)).
Un único documento. Historial (máximo 100 snapshots de `DiagramDocument`)
solo en RAM.

`z.strictObject` rechaza claves desconocidas. El MVP solo acepta
`schemaVersion` `1` y `storageVersion` `1`. No hay `migrate()`. JSON
corrupto o versión distinta es `PARSE_INVALID`: no se sobrescribe hasta
«Comenzar limpio».

## Qué es un bump

### `schemaVersion`

Sube **antes** de persistir cualquier cambio de forma de
`DiagramDocument`. Ejemplos:

- Campo nuevo, obligatorio u opcional, en documento, elemento o relación.
- Quitar o renombrar un campo.
- Cambiar el tipo o el significado de un campo existente.
- Nuevo `kind` de elemento o relación (Generalization, notas persistidas,
  extension points, actores con `kind` nuevo).
- `document.kind` distinto de `use-case` (primer extra: clases, W17-13).
- Geometría persistida que hoy no existe (waypoints en el documento).
- Cambiar la matriz de conexión de forma incompatible.

No sube por chrome, copy, avisos no persistidos ni export raster.

Consecuencia de producto ([post-mvp-spec.md](../product/post-mvp-spec.md)):
un bump de `schemaVersion` es línea **2.0**. La línea **1.x** permanece
en schema `1`.

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

### Producto 1.x vs 2.0

| Línea | Persistencia |
| --- | --- |
| Patch `1.0.x` | Schema `1` / storage `1`. Defectos, copy, a11y ya especificada. |
| Minor `1.x.0` | Schema `1`. FR aditivos **no persistidos** (chrome, warnings) o I/O de archivo sobre el mismo documento. `storageVersion` solo sube si cambia el envelope, no el documento. |
| Major `2.0.0` | `schemaVersion >= 2` y `migrate()` implementado **antes** del primer save de esa forma. El primer `document.kind` extra (W17-13) ya es este bump. |

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

Waypoints, estilos, extension points, notas, Generalization y el
diagrama de clases **no** tienen forma persistida aquí. Cuando una TASK
futura las desbloquee con fuente canónica, bumpan `schemaVersion` y
siguen esta política. Inventar esa forma en una TASK de implementación
es stop.

FR-P07 (plataforma por `kind`) no bumpa solo: el host vacío no se
persiste. El primer `document.kind` extra es el bump.

## Envelope público (FR-P03)

Intercambio de **archivo**, no el adapter de workspace. No sustituye el
autosave. No es IndexedDB, no es sync, no es multi-documento.

```text
ArkUmlDocumentFile
├─ format: "arkuml-usecase-json"
├─ formatVersion: 1
├─ document: DiagramDocument   (schemaVersion 1)
└─ view: { x, y, zoom }
```

Reglas:

- `format` y `formatVersion` identifican el archivo. No se reutiliza
  `storageVersion` (eso es interno del workspace).
- `document` y `view` se validan con el mismo Zod estricto que el MVP.
- Exportar: serializar el documento activo y su viewport.
- Importar: validar → sustituir documento y viewport en memoria → el
  autosave escribe `WorkspaceSnapshot` en `arkuml:workspace:v1`.
- Si hay cambios en el workspace, la confirmación es la de «Nuevo
  diagrama».
- Un blob de localStorage (`WorkspaceSnapshot`) **no** es el formato
  público. Copiar la clave no es import.

Rechazo de archivo (no se escribe el workspace):

- JSON inválido.
- `format` distinto de `arkuml-usecase-json`.
- `formatVersion` distinto de `1`.
- `schemaVersion` distinto de `1` (hasta que exista `migrate()` para esa
  versión y el producto sea 2.0).
- Claves desconocidas en cualquier `strictObject`.
- `kind` de documento, elemento o relación desconocido.

Este I/O no cambia `DiagramRepository`. No reabre ADR-004.

El identificador `arkuml-usecase-json` es del intercambio schema `1`
(casos de uso). **No** se reutiliza para un documento de clases. El
nombre del envelope 2.x se decide en la TASK que desbloquee W17-13.

## `migrate()`

Infraestructura, no FR de usuario. Obligatorio **antes** del primer bump
que se persista. No se implementa mientras el producto escriba schema `1`.

Orden:

1. `JSON.parse`. Fallo → `PARSE_INVALID`; no migrar; no sobrescribir.
2. Leer `storageVersion` y `schemaVersion` por inspección, sin exigir aún
   el schema actual.
3. Versión desconocida o mayor que la soportada → rechazo (abajo).
4. Encadenar migraciones enteras, en orden, sin saltos: `1→2`, luego
   `2→3`. Nunca `3→1`. Nunca un `migrateToLatest` opaco.
5. Validar el resultado con Zod del schema **destino**. Falla →
   `PARSE_INVALID`; no persistir el intento.
6. El resultado vive en memoria. El primer save de una versión que el
   MVP no puede abrir exige confirmación explícita (el workspace es
   único; la conversión es irreversible para 1.0). No hay dual-write de
   schema `1` y `2`.

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
Eso es correcto: 2.0 es major. No se parchea el parser 1.0 para aceptar
claves futuras.

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

Ningún ADR se reabre en esta TASK ni en la primera wave recomendada
(W12-01 + W13-02: schema `1`, sin persistencia).

| ADR | ¿Reabrir? | Motivo |
| --- | --- | --- |
| [ADR-004](../decisions/ADR-004-persistence.md) | **Sí, antes de código**, si C-QUOTA adelanta IndexedDB o una revisión futura levanta multi-documento (W14-02). | Cambia el backend o la cardinalidad del workspace. |
| ADR-004 | **No** para FR-P03 / W14-03. | Archivo del documento activo; el adapter `LocalStorageDiagramRepository` no cambia. |
| ADR-004 | **No** para W14-05. | Sync multi-tab sigue last-write-wins; exclusión vigente. |
| [ADR-003](../decisions/ADR-003-state-management.md) | **Sí, antes de código**, si el historial deja de ser RAM-only, se persiste, o undo debe restaurar viewport/selección. | Hoy: pila 100 en RAM; undo no restaura viewport. |
| ADR-003 | **No** para FR-P01/P02/P04 ni para FR-P03. | Warnings, guías y minimap no entran al historial; el JSON de usuario no serializa la pila. |
| [ADR-006](../decisions/ADR-006-export.md) | **No** en esta política. | Export de imagen; fuera de alcance de TASK-032. Se reabre solo por C-EXPORT o W15-01/02. |
| ADR-001 / ADR-002 | **No** por persistencia. | Toolchain y motor gráfico. Waypoints persistidos (W13-01) exigirían addendum de ADR-002 **además** del bump de schema. W17-13 (clases) puede exigir addendum de ADR-002 y de marca **antes** de código; no se reabre aquí. |
| ADR-004 | **No** para W17-01/13. | Un documento, un kind. No es lista de diagramas (W14-02). |

Quien toque `src/persistence` por IndexedDB o multi-doc **para** y abre
ADR-004. Quien persista el historial **para** y abre ADR-003. FR-P03 no
es ninguno de los dos.

## Fase 14 (disposición)

| ID | Destino tras esta política |
| --- | --- |
| W14-01 IndexedDB | Condicional C-QUOTA. Backend no elegido. ADR-004 primero. |
| W14-02 Multi-documento | Exclusión vigente. Esta política no diseña lista ni switch. |
| W14-03 JSON de usuario | Autorizado en spec. Envelope arriba. Sin ADR-004. |
| W14-04 `migrate()` | Política publicada. Código no autorizado hasta un bump en una wave. |
| W14-05 Sync multi-tab | Exclusión vigente. Last-write-wins. |

## Fuera de esta política

- Implementar `migrate()`, IndexedDB, import/export JSON o cambiar Zod.
- Reabrir o enmendar ADRs (solo se listan reaperturas **futuras**).
- Forma persistida de Generalization, notas, waypoints, estilos o clases.
- TASK-037+ o un freeze nuevo.
