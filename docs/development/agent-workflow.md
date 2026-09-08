# Workflow del agente implementador (Cursor + Grok 4.6)

Este documento es el procedimiento. Las reglas en `.cursor/rules/` son restricciones cortas. Las TASK son el contrato. No hay `AGENTS.md`: Cursor trata ese archivo como **alternativa** a Project Rules; usarlo duplicaría tokens.

## Capas de contexto

| Capa | Qué es | Cuándo |
| --- | --- | --- |
| GLOBAL | `.cursor/rules/00-core.mdc` (`alwaysApply`) | Todos los chats |
| CONTEXTUAL | `domain.mdc` / `testing.mdc` por glob; ADRs y docs de arquitectura | Cuando la TASK los cita o los archivos coinciden |
| TASK-SPECIFIC | `docs/tasks/TASK-NNN.md` | **Un** archivo por chat |

No adjuntar `docs/` entero ni el historial de un chat anterior.

## Modelo

- Grok 4.6 **high** por defecto.
- **xhigh** solo si la TASK es de debugging difícil o el spike de export falla; no es necesario para scaffolding.

## Flujo (obligatorio)

1. Leer `00-core` (ya inyectada) y la TASK adjunta.
2. Leer únicamente los docs listados en la TASK.
3. Inspeccionar Git y archivos existentes (`git status`, abrir rutas citadas).
4. Escribir un plan breve (10 líneas): alcance, archivos, tests. Esperar no hace falta si la TASK no tiene decisiones abiertas.
5. Implementar solo esa TASK.
6. Ejecutar los comandos de verificación de la TASK. Corregir fallos introducidos.
7. Revisar el diff: nada fuera de alcance, nada generado (`dist/`, reports).
8. Verificar criterios de aceptación uno a uno.
9. Handoff: archivos, comandos **realmente** ejecutados y su resultado, validación de navegador si aplica, riesgos, desviaciones.
10. Cerrar el chat. El siguiente empieza en frío con la siguiente TASK.

## Prohibido

- Refactors no solicitados, nuevas dependencias, cambios de API, implementar TASK futuras.
- Modificar ADRs «de paso». Si la implementación exige cambiar una decisión: **stop condition** — documentar y preguntar.
- Afirmar que los tests pasan si no se corrieron.
- Crear subagentes personalizados para trabajo rutinario.

## Subagentes

No hay subagentes de proyecto en `.cursor/agents/` en esta fase.

Cuando exista código, un verificador **readonly** es opcional en TASK de alto riesgo (008 spike, 016 export, 018 E2E, 020 release):

- Propósito: re-leer criterios de aceptación y diff, sin editar.
- Contexto: la TASK, el diff, logs de test.
- `model: inherit`, `readonly: true`.
- No usarlo en TASK-001–007.

## Definition of Done global

Una TASK no está hecha porque «el código arranca».

- El diff cabe en el alcance; no hay archivos generados.
- Cada criterio de aceptación está demostrado con test o evidencia explícita.
- Comandos de la TASK ejecutados (cuando existan: format, lint, typecheck, unit, build, E2E relevante).
- Sin `any` injustificado, dead code, tests borrados o skips nuevos sin justificación.
- Dependencias nuevas solo si la TASK las autoriza y el ADR lo permite.
- Documentación canónica actualizada **solo** si cambió un contrato observable.
- Handoff honesto: no afirmar tests no corridos.

## Stop conditions

Parar y preguntar si hace falta:

- Nueva dependencia o cambiar un pin (TS, html-to-image, Prettier).
- Alterar el modelo persistido o un ADR.
- Tocar archivos fuera de «Archivos/módulos afectados».
- El spike de export falla en un navegador soportado.

## Prompts

Chat nuevo:

```text
Implementa @docs/tasks/TASK-NNN.md.
Inspecciona archivos citados, resume un plan breve y respeta «Fuera del alcance».
No cambies dependencias ni ADRs.
Termina con los comandos de la TASK y un handoff.
```

Grok 4.6 en el model picker. No adjuntar el canvas de planificación.
