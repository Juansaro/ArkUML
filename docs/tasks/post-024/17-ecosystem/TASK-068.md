# TASK-068: Prompts MCP y runbook de clientes

## Estado documental

Lista

## Objetivo

Publicar prompts MCP (`draft-diagram`, `review-diagram`,
`extend-diagram`) y un runbook con ejemplos de configuración para
hosts compatibles (Cursor, Claude Desktop, y nota genérica para
Grok/GPT/VS Code u otros que hablen MCP stdio), sin secrets.

## Prioridad

P1

## Dependencias

TASK-067

## Contexto obligatorio

- @docs/architecture/mcp.md
- @docs/decisions/ADR-009-mcp-ai-integration.md
- @docs/operations/static-hosting.md
- @docs/product/post-mvp-spec.md
- @README.md

## Estado inicial

Tools de lectura y mutación `Hecha`. No hay `registerPrompt` ni
`docs/operations/mcp-clients.md`. README solo tiene puntero corto de
lanzamiento.

## Dentro del alcance

- Registrar los tres prompts de `mcp.md` en el servidor.
- Crear [`docs/operations/mcp-clients.md`](../../../operations/mcp-clients.md):
  - prerrequisitos (Node, `npm ci`, script `mcp`);
  - ejemplo `mcp.json` / config Cursor;
  - ejemplo Claude Desktop (`claude_desktop_config.json`);
  - nota genérica: cualquier host stdio con `command` + `args` al
    script del repo (Grok, ChatGPT con MCP, VS Code, …);
  - flujo: agente edita JSON → usuario importa en la SPA (FR-P03);
  - explícitamente **no**: API keys de modelos, HTTP remoto, SaaS.
- Enlazar desde README y `architecture.md` si la lista de docs se
  toca.
- Test mínimo: prompts registrados (lista no vacía) o smoke de factory.

## Fuera del alcance

- Cuentas, OAuth, marketplace de plugins.
- Cambiar tools de mutación salvo copy de descripción.
- PWA, analytics, backend.
- Código de chrome SPA.

## Archivos / módulos afectados

- `mcp/prompts/**` (o registro en `server.ts`)
- `docs/operations/mcp-clients.md` (nuevo)
- `README.md` (enlace)
- `docs/architecture/architecture.md` (puntero opcional)
- `docs/architecture/mcp.md` (enlace al runbook)
- `docs/tasks/post-024/17-ecosystem/TASK-068.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un desarrollador configura Cursor o Claude Desktop en <10 minutos y un
agente puede usar prompts + tools contra archivos del repo.

## Restricciones

- Sin secrets ni `.env` de proveedores.
- No afirmar que un host concreto está «certificado» como producto.
- Recetas ilustrativas; paths relativos al clone.

## Criterios de aceptación

- [ ] Tres prompts registrados con argumentos tipados.
- [ ] Existe `docs/operations/mcp-clients.md` con Cursor + Claude +
      nota genérica stdio.
- [ ] README enlaza el runbook.
- [ ] Prohíbe API keys / HTTP remoto / SaaS.
- [ ] `npm run check` (o subset que la TASK deba) verde.

## Tests

Smoke de registro de prompts; revisión documental.

## Comandos de verificación

```bash
npm run check
```

## Stop conditions

- Se pide publicar el servidor como SaaS.
- Se pide guardar API keys en el repo.
- Se pide integración que no sea MCP.

## Definition of Done

FR-A03 publicado; prompts vivos; criterios `[x]`; handoff.

## Evidencia de cierre

Pendiente.
