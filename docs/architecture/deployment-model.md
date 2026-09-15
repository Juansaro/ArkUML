# Modelo de diagrama de despliegue (Release 2)

Contrato del `document.kind` `"deployment"` en la línea **3.0**. No
autoriza código; la implementación es TASK-056 (dominio) y TASK-057
(chrome).

`mvp-spec.md` gana para casos de uso. Este archivo gana para despliegue.
La política de módulo por kind está en
[`diagram-kinds.md`](diagram-kinds.md). El bump es
[`schema-evolution.md`](schema-evolution.md).

## Fuente UML

[OMG Unified Modeling Language 2.5.1](https://www.omg.org/spec/UML/2.5.1/PDF)
(`formal/2017-12-05`), cláusula **19 Deployments**:

| Concepto UML | Apartado | Uso en ArkUML |
| --- | --- | --- |
| `Node` | 19.3 / 19.5.10 | Elemento `node` (prisma) |
| `Artifact` | 19.3 / 19.5.1 | Elemento `artifact` |
| `CommunicationPath` | 19.5.4 | Relación `communication-path` |
| `Deployment` | 19.5.5 | Relación `deploy` (artefacto → nodo) |

Un único `kind` de nodo: no se distingue Device de ExecutionEnvironment.

## Dentro del subconjunto

Un documento `kind: "deployment"` y `schemaVersion: 3` contiene solo:

### Nodo y artefacto

```text
{
  id: UUID,
  kind: "node" | "artifact",
  name: string,          // 1–80 tras trim
  geometry: { x, y, width, height }
}
```

Notación: `node` = prisma 3D (caja con cara superior, UML 2.5.1
fig. 19.2); `artifact` = rectángulo con icono de documento plegado y
el nombre. Sin `«manifest»`, sin nested nodes.

Valores por defecto: nodo `200×120` (mínimo `120×72`); artefacto
`140×80` (mínimo `96×48`).

### Relaciones

```text
{
  id: UUID,
  kind: "communication-path" | "deploy",
  sourceId: UUID,
  targetId: UUID,        // distinto de sourceId
  name: string           // 0–80
}
```

| `kind` | Extremos | Trazo |
| --- | --- | --- |
| `communication-path` | `node` — `node` | Continuo, sin punta (asociación) |
| `deploy` | `artifact` → `node` | Discontinuo, punta abierta; etiqueta «deploy» derivada |

`canConnect`: path solo nodo–nodo; deploy solo artefacto→nodo. Self
ilegal. Duplicados permitidos.

### Documento vacío

Título por defecto «Diagrama de despliegue». Sin elementos ni
relaciones. Viewport `{ x: 0, y: 0, zoom: 1 }`.

### Cardinalidad de kinds en el documento

Sin mezcla con otros módulos. `PARSE_INVALID` / `UNKNOWN_KIND`.

## Fuera del subconjunto

- `Device` vs `ExecutionEnvironment` como kinds distintos.
- `DeploymentSpecification`, nodos anidados, `manifest` persistido.
- Artefacto desplegado **dentro** de la geometría del nodo (`parentId`).
- Instancias (`:` nombre).

Inventar cualquiera de esos en una TASK de implementación es stop.

## Operaciones de dominio

`createNode`, `createArtifact`, rename/move/resize/delete (cascada),
`duplicateElements` (sin relaciones), `createRelationship` según
`canConnect`, rename/delete de relaciones.

Warnings no bloqueantes: ninguno.

## Chrome (contrato para TASK-057)

Paleta: Selección; Nodo; Artefacto; Camino; Desplegar. Inspector:
nombre; en relación, kind y extremos. Iconos: addendum de marca antes
de pintar.

## Qué no se decide aquí

Biblioteca (ADR-007). Envelope 3.x. Motor: addendum ADR-002 (prisma =
nodo custom; no segundo motor).
