# ADR-009: Integración con agentes de IA vía MCP

## Status

Aceptada (TASK-064, 2026-09-21). Vigente para el ciclo **Release 3
(MCP)**. No se implementa en esta TASK; el código es TASK-066–068.

## Context

ArkUML es una SPA estática local (sin SaaS, sin backend, sin secrets).
Release 2 cerró ocho `document.kind` sobre schema `3`. Los hosts de
agentes (Cursor, Claude Desktop, Grok, ChatGPT con MCP, VS Code, etc.)
hablan el [Model Context Protocol](https://modelcontextprotocol.io/):
un **servidor** expone tools/resources/prompts; el **modelo** vive en el
host, no en ArkUML.

El humano pide que un agente pueda crear y editar diagramas ArkUML sin
convertir el producto en un chat embebido ni en un SaaS con API keys.

## Problem

¿Cómo exponer el modelo canónico a agentes de forma client-agnostic
sin romper W17-02 (sin backend/SaaS), sin secretos en el repo y sin
duplicar UML fuera de `src/domain`?

## Options

1. Llamadas LLM desde la SPA (OpenAI/Anthropic/xAI en el browser o proxy).
2. Plugin propietario por IDE (solo Cursor, solo Claude, …).
3. Servidor MCP local (stdio) que reutiliza `src/domain` y opera sobre
   archivos JSON del envelope `arkuml-document-json`.
4. MCP remoto HTTP con auth (multi-usuario).

## Decision

Opción 3.

- **Un** servidor MCP en este repositorio (`mcp/`), transport **stdio**.
- SDK oficial TypeScript: `@modelcontextprotocol/server` (pin exacto en
  la TASK de instalación; no se elige aquí la minor). Zod del repo
  (`4.x`) para schemas de tools.
- Mutaciones **solo** vía operaciones puras de `src/domain/diagram`.
  El MCP no importa React, Zustand, DOM ni `@xyflow/react`.
- Persistencia del agente: archivos en disco con el envelope de
  FR-P03 (`arkuml-document-json`, `formatVersion` vigente). **No**
  lee ni escribe `localStorage` del browser (ADR-004/007 siguen
  siendo el autosave de la SPA).
- Puente humano: el usuario importa el JSON en la SPA (FR-P03) o
  guarda desde la SPA y apunta el MCP al mismo path.
- Client-agnostic: un binario; manifests/ejemplos por host en
  `docs/operations/mcp-clients.md` (TASK-068). No hay SDK distinto
  por Cursor / Grok / GPT / Claude.
- Sin API keys de modelos en ArkUML. Sin Streamable HTTP remoto en
  Release 3. Sin telemetría.

## Rationale

La opción 1 introduce secrets y un backend implícito (rompe O-08 /
W17-02). La 2 multiplica mantenimiento. La 4 es SaaS. La 3 reutiliza
el contrato ya testeado (`DiagramDocument` + envelope), encaja con
hosts locales que ya usan MCP, y mantiene `DiagramDocument` como
única fuente de verdad.

## Consequences

- Aparece un entrypoint Node (`mcp/`) y una dependencia nueva
  autorizada solo por este ADR + TASK-066.
- El agente no ve la biblioteca de la SPA hasta que el humano
  exporta/importa archivos; no se reabre ADR-007 ni ADR-004.
- Schema `3` / `storageVersion` 2 **no** suben. Release 3 es
  ecosistema, no metamodelo.
- O-08 se parte otra vez: entra W17-20–22 (MCP local); permanecen
  exclusión backend/auth/collab/SaaS/PWA/analytics.

## Rejected alternatives

- **Opción 1:** secrets, cuota, producto distinto.
- **Opción 2:** acoplamiento a un host; contradice «Cursor, Grok,
  GPT, Claude».
- **Opción 4:** auth, red, fuera de alcance vigente.

## Relación con otros ADR

| ADR | Efecto |
| --- | --- |
| ADR-001 | Autoriza pin de `@modelcontextprotocol/server` en TASK-066; no cambia Vite/React/TS. |
| ADR-004 / ADR-007 | Sin cambio: autosave browser intacto; MCP usa archivos. |
| ADR-002 / ADR-006 | MCP no rasteriza ni proyecta React Flow. |
| ADR-003 | Historial de la SPA no aplica al proceso MCP. |
| ADR-008 | Kinds R2 siguen disponibles vía dominio; sin metamodelo nuevo. |
