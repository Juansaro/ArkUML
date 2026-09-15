# Tipos de diagrama (`document.kind`)

Política de cómo el editor admite más de un `document.kind`. No autoriza
código por sí sola. Metamodelos:

- Secuencia: [`sequence-model.md`](sequence-model.md)
- Clases: [`class-model.md`](class-model.md)
- Componentes: [`component-model.md`](component-model.md)
- Despliegue: [`deployment-model.md`](deployment-model.md)
- ER Chen: [`er-model.md`](er-model.md) ([ADR-008](../decisions/ADR-008-chen-er.md))
- Actividades: [`activity-model.md`](activity-model.md)
- Interacción general: [`interaction-overview-model.md`](interaction-overview-model.md)

`mvp-spec.md` gana para casos de uso. El contrato de alcance está en
[`post-mvp-spec.md`](../product/post-mvp-spec.md) (FR-P07, FR-R03–R09,
W17-01, W17-13–19). El bump de schema está en
[`schema-evolution.md`](schema-evolution.md). La lista de documentos es
[ADR-007](../decisions/ADR-007-workspace-library.md).

## Números vigentes

| Número | Valor | Efecto aquí |
| --- | --- | --- |
| Producto 1.x | Schema `1` | Un único `document.kind`: `use-case` |
| Producto 2.0 (Release 1) | `schemaVersion` `2` | Unión `"use-case" \| "sequence"` |
| Producto 3.0 (Release 2) | `schemaVersion` `3` | Unión aditiva: los seis kinds de FR-R04–R09 se añaden **uno a uno** en TASK-052–062 |

Un documento schema `1` con `kind` distinto de `use-case` es
`UNKNOWN_KIND` / `PARSE_INVALID`. Schema `2` no conoce los kinds 3.0.
`migrate()` `2→3` **antes** del primer save schema 3.

## Cardinalidad

Un documento, un `kind`. En 2.0/3.0 la **biblioteca** (ADR-007) guarda
varios documentos; cada uno tiene un `kind`. El combobox activa otra
fila; no convierte el kind del documento actual.

Un control que ofrezca un kind sin módulo completo (paleta, reglas,
export) es medio-implementar (regla TASK-020). «Nuevo» solo lista kinds
cuyo módulo de chrome está `Hecha`.

## Unión Zod aditiva (Release 2)

El número de schema es **3** para todo el ciclo. La unión de
`document.kind` **crece** en cada TASK de dominio:

1. TASK-052: `"use-case" | "sequence" | "class"`
2. TASK-054: `+ "component"`
3. TASK-056: `+ "deployment"`
4. TASK-058: `+ "entity-relationship"`
5. TASK-060: `+ "activity"`
6. TASK-062: `+ "interaction-overview"`

Un JSON schema 3 cuyo `kind` aún no está en la unión es `UNKNOWN_KIND`.
No se bumpa a schema 4–8. `storageVersion` permanece 2.

## Módulo por kind

Cada `document.kind` es un módulo, no un `if (kind)` repartido por el
chrome. Superficies que el módulo debe cubrir:

| Superficie | Qué resuelve el módulo |
| --- | --- |
| Paleta | Herramientas y copy de ese kind |
| Nodos / edges | `nodeTypes` / `edgeTypes` y notación |
| Reglas | `canConnect`, cardinalidades, nombres |
| Inspector | Campos y avisos del kind |
| Warnings | Códigos estables de ese kind |
| Export raster | Misma tubería `exportDiagram`; el módulo no añade chrome al PNG/JPG |

El kind `use-case` es el módulo 1.x. Release 1 añade secuencia.
Release 2 añade los seis de FR-R04–R09, cada uno en su par
dominio/chrome. El registry mínimo de TASK-049 se reutiliza; no se
inventa un plugin loader.

Prohibido:

- Campo huérfano en el documento sin paleta ni reglas.
- Paleta de un kind que el schema no persiste.
- Export que ignore elementos de un kind persistido.
- Kit de iconos externo. Un kind nuevo exige addendum de
  [`brand-system.md`](../product/brand-system.md) **antes** de código.

## Qué no se decide aquí

- Fragmentos u otros mensajes fuera de `sequence-model.md`.
- Crow’s foot, Interaction inline, `ref` a otro documento.
- Reabrir ADR-002 como segundo motor (el addendum de proyección está
  en TASK-051) o ADR-006.

El envelope de archivo 3.x es `arkuml-document-json` / `formatVersion`
3 (`schema-evolution.md`). `formatVersion` 2 permanece para schema 2.
`arkuml-usecase-json` permanece para schema 1.

Inventar forma fuera del `*-model.md` del kind en una TASK de
implementación es stop.

## Fuera de esta política

- Código en `src/` (TASK-046–049, TASK-052–063).
- Host vacío.
- Temas, segundo motor gráfico, IndexedDB.
