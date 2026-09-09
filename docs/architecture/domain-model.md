# Modelo de dominio

El dominio es independiente de React, del DOM y de React Flow. Las pruebas de `src/domain` no necesitan jsdom.

## Tipos conceptuales

```text
WorkspaceSnapshot
├─ storageVersion: 1
├─ document: DiagramDocument
│  ├─ schemaVersion: 1
│  ├─ id: UUID
│  ├─ kind: "use-case"
│  ├─ metadata: { title, createdAt, updatedAt }
│  ├─ elements: DiagramElement[]
│  └─ relationships: Relationship[]
└─ view: { x, y, zoom }
```

`DiagramElement` es una unión discriminada por `kind`:

- `Actor`: `{ id, kind: "actor", name, geometry }`
- `UseCase`: `{ id, kind: "use-case", name, geometry, parentId? }`
- `SystemBoundary`: `{ id, kind: "system-boundary", name, geometry }`

`Relationship`:

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

`geometry`: `{ x, y, width, height }` con números finitos. Posición relativa al padre si `parentId` existe.

No se persisten: `selected`, `measured`, internals de React Flow, CSS, componentes, etiquetas «include»/«extend» (se derivan de `kind`).

## Identificadores

- UUID v4 vía `crypto.randomUUID`, encapsulado en una factory inyectable para tests.
- Estables durante la vida del documento. Duplicar genera ids nuevos.

## Tiempos y títulos

- `createdAt` / `updatedAt`: ISO-8601.
- `metadata.title`: string 1–80 tras trim. Default: «Diagrama de casos de uso».
- Nombres de elementos: 1–80 tras trim. Duplicados permitidos.

## Documento por defecto

Un documento nuevo contiene:

1. Metadata con título por defecto y timestamps.
2. Un `SystemBoundary` llamado «Sistema», tamaño inicial suficiente (por ejemplo `640×400`) centrado en un origen razonable.
3. Sin actores, casos ni relaciones.
4. Viewport `{ x: 0, y: 0, zoom: 1 }` en el snapshot.

El boundary puede eliminarse. Mientras exista uno, la paleta no crea otro. Si no existe, se puede crear exactamente uno.

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
| `canConnect` / `createRelationship` | Matriz de [mvp-spec.md](../product/mvp-spec.md). |
| `deleteRelationships` | Por id. |

Validaciones no bloqueantes (no impiden el commit ni mutan el documento; la UI las muestra). Misma regla que [mvp-spec.md](../product/mvp-spec.md):

- Actor cuyo centro está dentro del rectángulo del boundary.
- UseCase sin padre cuyo centro está fuera del boundary.
- UseCase con padre cuyo centro está fuera del rectángulo de ese padre.

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

`schemaVersion` (documento) y `storageVersion` (snapshot) son independientes. El MVP solo acepta `1` / `1`. Una versión futura usará `migrate` explícito; la política está en [schema-evolution.md](schema-evolution.md).

## Serialización

`JSON.stringify` / parse + Zod. Sin clases, sin `toJSON` custom en prototipos. El mapper de React Flow no participa.

## Compatibilidad futura

- `kind` en documento, elemento y relación permite otros diagramas sin romper el parser si se usa unión exhaustiva y `default` que falle con `UNKNOWN_KIND`.
- Generalization será un `kind` de relación nuevo, no un flag en Association.
- Estilos visuales, si aparecen, vivirán en un mapa opcional versionado, no en el motor gráfico.
