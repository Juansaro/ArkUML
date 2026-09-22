# Integración MCP (Release 3)

Contrato del servidor Model Context Protocol de ArkUML. Complementa
[`architecture.md`](architecture.md) y
[ADR-009](../decisions/ADR-009-mcp-ai-integration.md). No autoriza
código por sí solo: la implementación es TASK-066–068.

## Principio

`DiagramDocument` sigue siendo la fuente de verdad. El servidor MCP es
un **cliente de dominio** en Node: lee/escribe el envelope JSON de
usuario (FR-P03) y llama operaciones puras de `src/domain/diagram`.
React Flow, el store y `localStorage` no participan.

```text
AI host (Cursor / Claude / Grok / GPT / …)
  → MCP (stdio)
    → tools / resources / prompts
      → domain operations + Zod parse
        → archivo .json (arkuml-document-json)
          ↔ import/export en la SPA (FR-P03)
```

## Layout del repo

```text
mcp/                   entrypoint Node del servidor (TASK-066+)
  server.ts            factory McpServer + serveStdio
  tools/               handlers tipados
  resources/           catálogo de kinds / resúmenes
  prompts/             plantillas de flujo (TASK-068)
src/domain/diagram/    sin imports hacia mcp/
docs/operations/mcp-clients.md   manifests por host (TASK-068)
```

`src/domain` **no** importa `mcp/`. `mcp/` **sí** puede importar
`src/domain/diagram` (y solo eso del producto).

## Transport y runtime

| Decisión | Valor |
| --- | --- |
| Transport | stdio (proceso lanzado por el host) |
| Runtime | Node `>=24.15 <25` (mismo `engines` que ADR-001) |
| SDK | `@modelcontextprotocol/server` `2.0.0` (pin exacto, TASK-066; Node `>=20`) |
| Logs | solo stderr; stdout es JSON-RPC |
| HTTP remoto | fuera de Release 3 |

## Tools (contrato mínimo)

Nombres estables con prefijo `arkuml_`. Inputs Zod. Errores de dominio
como resultado estructurado (código + mensaje), no como crash del
proceso.

| Tool | Lectura / escritura | Semántica |
| --- | --- | --- |
| `arkuml_list_kinds` | R | Lista `document.kind` soportados y resumen de elementos/relaciones. |
| `arkuml_create_document` | W (RAM) | Factory vacía por `kind` + título opcional; no escribe disco hasta save. |
| `arkuml_load_document` | R | Lee path → parse envelope → `DiagramDocument` (migrate si aplica). |
| `arkuml_save_document` | W | Serializa envelope vigente al path. |
| `arkuml_validate_document` | R | Parse Zod + `validation` de dominio; warnings incluidos. |
| `arkuml_list_elements` | R | Resumen de elementos/relaciones del documento en sesión o path. |
| `arkuml_create_element` | W | Delega a factories/operations del kind. |
| `arkuml_update_element` | W | Label, geometría y campos del metamodelo cerrado. |
| `arkuml_delete_element` | W | Borra elemento y relaciones incidentes (misma semántica que la SPA). |
| `arkuml_create_relationship` | W | `canConnect` + create; razón de rechazo explícita. |
| `arkuml_delete_relationship` | W | Borra por id. |
| `arkuml_describe_rules` | R | Matriz / reglas del kind activo (texto para el modelo). |

Sesión del proceso: el servidor puede mantener **un** documento en
memoria tras `create`/`load` hasta `save` o fin del proceso. No hay
multi-documento concurrente en Release 3 (la biblioteca de la SPA es
otro proceso).

Campos geométricos (`x`, `y`, `width`, `height`) son opcionales en
create: si faltan, defaults de dominio/factories. El agente no inventa
kinds ni estereotipos fuera del metamodelo.

## Resources

| URI | Contenido |
| --- | --- |
| `arkuml://kinds` | Catálogo JSON de kinds y capacidades. |
| `arkuml://kind/{kind}` | Resumen del metamodelo (elementos, edges, restricciones). |

No se exponen secrets ni el `localStorage` del usuario.

## Prompts

Plantillas MCP (TASK-068), no chat embebido en la SPA:

- `draft-diagram` — a partir de una descripción, crear documento de un
  `kind` y elementos mínimos.
- `review-diagram` — validar y listar warnings / huecos semánticos.
- `extend-diagram` — añadir elementos respetando `canConnect`.

## Qué no es MCP

- No sustituye la SPA ni el autosave browser.
- No exporta PNG/JPG (ADR-006).
- No abre IndexedDB ni sync (W17-02/03).
- No llama a proveedores de modelos.
- No añade `document.kind` nuevos.

## Verificación

- Tests unitarios de handlers con documentos sintéticos (Vitest, sin
  jsdom si es puro).
- Spike opcional con MCP Inspector (`npx @modelcontextprotocol/inspector`)
  documentado en el runbook de clientes; no es gate de CI en Release 3
  salvo que la TASK lo nombre.

## Entrypoint

`npm run mcp` ejecuta `mcp/server.ts` con `serveStdio`. El entrypoint no
escribe logs a stdout; el protocolo JSON-RPC conserva ese stream y los
errores operativos se informan por stderr.
