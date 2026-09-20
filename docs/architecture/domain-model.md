# Modelo de dominio

El dominio es independiente de React, del DOM y de React Flow. Las pruebas de `src/domain` no necesitan jsdom.

## Tipos conceptuales

Release 1 (schema **2**). Release 2 (TASK-052+): schema **3**, unión
`"use-case" | "sequence" | "class" | "component" | "deployment" | "entity-relationship"`. `storageVersion` permanece 2. El
árbol v1 del MVP permanece el origen de `migrateDocument` `1→2`. `2→3`
copia el documento 2 y solo escribe `schemaVersion: 3`.

```text
WorkspaceSnapshot
├─ storageVersion: 2
├─ activeDocumentId: UUID
└─ documents: { document: DiagramDocument, view }[]
   └─ document
      ├─ schemaVersion: 3
      ├─ id: UUID
      ├─ kind: "use-case" | "sequence" | "class" | "component" | "deployment" | "entity-relationship"
      ├─ metadata: { title, createdAt, updatedAt }
      ├─ elements: DiagramElement[]
      └─ relationships: Relationship[]
```

La lista no está vacía. Los `document.id` son únicos. `activeDocumentId`
coincide con exactamente un `document.id`. Envelope v1 (un `document` +
`view`, `storageVersion` 1): origen de `migrateWorkspace` `1→2` en
`src/persistence`.

`DiagramElement` es una unión discriminada por `kind`:

- `Actor`: `{ id, kind: "actor", name, geometry }`
- `UseCase`: `{ id, kind: "use-case", name, geometry, parentId? }`
- `SystemBoundary`: `{ id, kind: "system-boundary", name, geometry }`
- `Lifeline`: `{ id, kind: "lifeline", name, geometry, stemLength }` (solo `kind: "sequence"`)
- `Class`: `{ id, kind: "class", name, geometry, attributes, operations }` (solo `kind: "class"`)
- `Component`: `{ id, kind: "component", name, geometry }` (solo `kind: "component"`)
- `Node`: `{ id, kind: "node", name, geometry }` (solo `kind: "deployment"`)
- `Artifact`: `{ id, kind: "artifact", name, geometry }` (solo `kind: "deployment"`)
- `Entity`: `{ id, kind: "entity", name, geometry }` (solo `kind: "entity-relationship"`)
- `Attribute`: `{ id, kind: "attribute", name, geometry, isKey? }` (solo `kind: "entity-relationship"`; default `isKey` false)
- `ErRelationship`: `{ id, kind: "er-relationship", name, geometry }` (rombo; solo `kind: "entity-relationship"`)

`Relationship` es una unión discriminada por `kind`.

Casos de uso (sin cambio semántico respecto al MVP):

```text
{
  id,
  kind: "association" | "include" | "extend",
  sourceId,
  targetId,
  sourceAnchor: "top" | "right" | "bottom" | "left",
  targetAnchor: "top" | "right" | "bottom" | "left"
}
```

Secuencia (forma cerrada en [sequence-model.md](sequence-model.md)):

```text
{
  id,
  kind: "sync-message" | "reply-message",
  sourceId,
  targetId,
  name,   // 0–80 tras trim
  y
}
```

Clases (forma cerrada en [class-model.md](class-model.md)):

```text
{
  id,
  kind: "class-association" | "aggregation" | "composition" | "generalization",
  sourceId,
  targetId,
  name,   // 0–80 tras trim
  sourceMultiplicity, targetMultiplicity  // "0..1" | "1" | "0..*" | "1..*"; omitidos en generalization
}
```

Componentes (forma cerrada en [component-model.md](component-model.md)):

```text
{
  id,
  kind: "component-usage" | "assembly-connector",
  sourceId,
  targetId,
  name   // 0–80; vacío = sin etiqueta
}
```

Despliegue (forma cerrada en [deployment-model.md](deployment-model.md)):

```text
{
  id,
  kind: "communication-path" | "deploy",
  sourceId,
  targetId,
  name   // 0–80; vacío = sin etiqueta
}
```

ER Chen (forma cerrada en [er-model.md](er-model.md)):

```text
{
  id,
  kind: "er-link",
  sourceId,
  targetId,
  cardinality?   // "1" | "N"; solo entidad–rombo; prohibida en atributo–entidad
}
```

Un documento `use-case` no contiene lifelines ni mensajes. Un documento
`sequence` no contiene actor, caso, boundary ni Association/Include/Extend.
Un documento `class` no contiene actor, caso, boundary, lifeline ni
mensajes; un `use-case` o `sequence` no contiene `class` ni relaciones
de clases. Un documento `component` no mezcla con use-case, sequence ni
class; un `use-case`, `sequence` o `class` no contiene `component` ni
`component-usage` / `assembly-connector`. Un documento `deployment` no
mezcla con use-case, sequence, class ni component; un `use-case`,
`sequence`, `class` o `component` no contiene `node` / `artifact` ni
`communication-path` / `deploy`. Un documento `entity-relationship` no
mezcla con kinds UML; un documento UML no contiene `entity` /
`attribute` / `er-relationship` ni `er-link`. Violación al validar:
`UNKNOWN_KIND` (el loader de persistencia sigue mapeando a
`PARSE_INVALID`).

Release 2 (schema 3): cada kind extra tiene forma cerrada en
[class-model.md](class-model.md), [component-model.md](component-model.md),
[deployment-model.md](deployment-model.md), [er-model.md](er-model.md),
[activity-model.md](activity-model.md),
[interaction-overview-model.md](interaction-overview-model.md). Misma
regla de no-mezcla.

`geometry`: `{ x, y, width, height }` con números finitos. Posición relativa al padre si `parentId` existe.

No se persisten: `selected`, `measured`, internals de React Flow, CSS, componentes, etiquetas «include»/«extend» (se derivan de `kind`).

## Identificadores

- UUID v4 vía `crypto.randomUUID`, encapsulado en una factory inyectable para tests.
- Estables durante la vida del documento. Duplicar genera ids nuevos.

## Tiempos y títulos

- `createdAt` / `updatedAt`: ISO-8601.
- `metadata.title`: string 1–80 tras trim. Default casos de uso: «Diagrama de casos de uso». Default secuencia: «Diagrama de secuencia». Default clases: «Diagrama de clases». Default componentes: «Diagrama de componentes». Default despliegue: «Diagrama de despliegue». Default ER: «Diagrama entidad-relación».
- Nombres de elementos: 1–80 tras trim. Duplicados permitidos.

## Documento por defecto

Un documento nuevo contiene:

1. Metadata con título por defecto y timestamps.
2. Un `SystemBoundary` llamado «Sistema», tamaño inicial suficiente (por ejemplo `640×400`) centrado en un origen razonable.
3. Sin actores, casos ni relaciones.
4. Viewport `{ x: 0, y: 0, zoom: 1 }` en el snapshot.

El boundary puede eliminarse. Mientras exista uno, la paleta no crea otro. Si no existe, se puede crear exactamente uno.

Un documento secuencia nuevo (`createEmptySequenceDocument`) tiene título
«Diagrama de secuencia», sin lifelines ni mensajes. Operaciones de
secuencia: [sequence-model.md](sequence-model.md). `duplicateElements`
sobre secuencia solo copia lifelines (offset 24, sin mensajes). Self-message
está permitido; no aplica `SELF_RELATIONSHIP`.

Un documento class nuevo (`createEmptyClassDocument`) tiene título
«Diagrama de clases», sin clases ni relaciones. Operaciones de clases:
[class-model.md](class-model.md). `duplicateElements` solo copia clases
(offset 24, sin relaciones). `sourceId === targetId` es `SELF_RELATIONSHIP`.
Duplicados de la misma tupla están permitidos.

Un documento component nuevo (`createEmptyComponentDocument`) tiene título
«Diagrama de componentes», sin componentes ni relaciones. Operaciones:
[component-model.md](component-model.md). `duplicateElements` solo copia
componentes (offset 24, sin relaciones). `sourceId === targetId` es
`SELF_RELATIONSHIP`. Duplicados de la misma tupla están permitidos.

Un documento deployment nuevo (`createEmptyDeploymentDocument`) tiene título
«Diagrama de despliegue», sin nodos, artefactos ni relaciones. Operaciones:
[deployment-model.md](deployment-model.md). `duplicateElements` solo copia
nodos y artefactos (offset 24, sin relaciones). `canConnect`: path =
nodo–nodo; deploy = artefacto→nodo. `sourceId === targetId` es
`SELF_RELATIONSHIP`. Duplicados de la misma tupla están permitidos.

Un documento ER nuevo (`createEmptyErDocument`) tiene título
«Diagrama entidad-relación», sin entidades, atributos, rombos ni enlaces.
Operaciones: [er-model.md](er-model.md). `duplicateElements` solo copia
elementos (offset 24, sin `er-link`). `canConnect`: atributo–entidad o
entidad–rombo; un atributo solo un enlace; cardinalidad `"1"|"N"` solo en
entidad–rombo (default `"N"`). `sourceId === targetId` es
`SELF_RELATIONSHIP`.

## Operaciones puras

Todas devuelven un documento nuevo o un error de dominio con `code` estable y `message` para UI.

| Operación | Comportamiento |
| --- | --- |
| `createElement` | Inserta actor, use case o boundary según reglas de máximo uno. |
| `renameElement` | Valida longitud. |
| `moveElements` | Actualiza geometría; al mover boundary, los hijos se mueven con él (coordenadas relativas). |
| `resizeBoundary` | Mínimo 320×240. |
| `reparentUseCase` | Convierte coordenadas para preservar posición visual. |
| `deleteElements` | Cascada de relaciones; unboundarying si se borra el boundary. |
| `duplicateElements` | Solo actor/use case; offset 24; sin relaciones. |
| `snapshotDuplicableElements` / `insertElementCopies` | Misma selección que duplicar; el pegado reutiliza el offset 24. |
| `canConnect` / `createRelationship` | Matriz de [mvp-spec.md](../product/mvp-spec.md). |
| `reconnectRelationship` | Mismos extremos y matriz que `createRelationship`; conserva el `id`; el duplicado se evalúa sin esa relación. |
| `deleteRelationships` | Por id. |

Validaciones no bloqueantes (no impiden el commit ni mutan el documento; la UI las muestra). Misma regla que [mvp-spec.md](../product/mvp-spec.md):

- Actor cuyo centro está dentro del rectángulo del boundary.
- UseCase sin padre cuyo centro está fuera del boundary.
- UseCase con padre cuyo centro está fuera del rectángulo de ese padre.
- `INCLUDE_CYCLE`: caso de uso en un componente fuertemente conexo de
  tamaño ≥ 2 del grafo dirigido Include (`sourceId` → `targetId`). Copy:
  «Participa en un ciclo de Include.»
- `EXTEND_CYCLE`: análogo en el grafo dirigido Extend. Copy: «Participa
  en un ciclo de Extend.»

Association no participa. Include y Extend son grafos distintos. El aviso
no afirma ilegalidad UML, no se persiste y no entra al historial. Un
self-loop sigue siendo el error bloqueante `SELF_RELATIONSHIP`.

## Errores de dominio (códigos)

Usar estos códigos; no strings ad hoc:

- `INVALID_NAME`
- `BOUNDARY_EXISTS`
- `UNKNOWN_ELEMENT`
- `INVALID_PARENT`
- `INVALID_GEOMETRY`
- `INVALID_CONNECTION`
- `DUPLICATE_RELATIONSHIP`
- `SELF_RELATIONSHIP`
- `UNKNOWN_RELATIONSHIP`

## Schema runtime

Zod 4 valida `WorkspaceSnapshot` al cargar. `z.strictObject` (o equivalente Zod 4) rechaza claves desconocidas en el documento. Datos corruptos **no** se migran en silencio y **no** se sobrescriben hasta que el usuario confirme «comenzar limpio».

`schemaVersion` (documento) y `storageVersion` (snapshot) son independientes.
El parser actual en `src/` acepta `schemaVersion` `3` y `storageVersion`
`2`. `migrateDocument` encadena `1→2→3`. `migrateWorkspace` no cambia de
envelope; si la biblioteca 2.0 aún guarda documentos schema 2, los sube
con `migrateDocument` antes del primer save 3. Política:
[schema-evolution.md](schema-evolution.md).

## Serialización

`JSON.stringify` / parse + Zod. Sin clases, sin `toJSON` custom en prototipos. El mapper de React Flow no participa.

## Compatibilidad futura

- `kind` en documento, elemento y relación permite otros diagramas sin romper el parser si se usa unión exhaustiva y `default` que falle con `UNKNOWN_KIND`. Política: [diagram-kinds.md](diagram-kinds.md). 1.x solo `use-case`. Release 1: `"use-case" | "sequence"`. Release 2 (TASK-052): `"use-case" | "sequence" | "class"`; TASK-054: `+ "component"`; TASK-056: `+ "deployment"`; TASK-058: `+ "entity-relationship"`; TASK-060+ amplían la unión.
- Workspace 2.0 (biblioteca): [ADR-007](../decisions/ADR-007-workspace-library.md). Envelope `storageVersion` 2. Release 2 no lo cambia.
- ER Chen: [ADR-008](../decisions/ADR-008-chen-er.md).
- Generalization **en casos de uso** será un `kind` de relación nuevo, no un flag en Association; no entra en Release 2.
- Estilos visuales, si aparecen, vivirán en un mapa opcional versionado, no en el motor gráfico.
