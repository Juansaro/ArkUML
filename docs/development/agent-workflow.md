# Workflow del agente implementador (Cursor + Grok 4.6)

Este documento es el procedimiento. Las reglas en `.cursor/rules/` son restricciones cortas. Las TASK son el contrato. No hay `AGENTS.md`: Cursor trata ese archivo como **alternativa** a Project Rules; usarlo duplicaría tokens.

## Capas de contexto

| Capa | Qué es | Cuándo |
| --- | --- | --- |
| GLOBAL | `.cursor/rules/00-core.mdc` (`alwaysApply`) | Todos los chats |
| CONTEXTUAL | `domain.mdc` / `testing.mdc` por glob; ADRs y docs de arquitectura | Cuando la TASK los cita o los archivos coinciden |
| TASK-SPECIFIC | `docs/tasks/**/TASK-NNN.md` | **Un** archivo por chat |

No adjuntar `docs/` entero ni el historial de un chat anterior.

TASK-001–025 conservan su ruta plana. Desde TASK-026, la ruta canónica vive
bajo `docs/tasks/post-024/<fase>/`. Un ID corresponde a un solo archivo: no se
crean stubs, aliases ni copias planas.

## Modelo

- Grok 4.6 **high** por defecto.
- **xhigh** solo si la TASK es de debugging difícil o el spike de export falla; no es necesario para scaffolding.

## Flujo (obligatorio)

1. Leer `00-core` (ya inyectada) y la TASK adjunta.
2. Leer únicamente los docs listados en la TASK.
3. Confirmar en el índice correspondiente que la TASK está `Lista`. Cambiar la
   TASK y el índice a `En curso`.
4. Inspeccionar Git y archivos existentes (`git status`, abrir rutas citadas).
5. Escribir un plan breve (10 líneas): alcance, archivos, tests. Esperar no hace falta si la TASK no tiene decisiones abiertas.
6. Implementar solo esa TASK.
7. Ejecutar los comandos de verificación de la TASK. Corregir fallos introducidos.
8. Revisar el diff: nada fuera de alcance, nada generado (`dist/`, reports).
9. Verificar criterios de aceptación uno a uno y marcarlos `[x]` solo con
   evidencia.
10. Si termina: cambiar TASK/índice a `Hecha` y completar «Evidencia de
    cierre» con fecha, comandos y commit/PR/handoff si existe. Si se activa una
    stop condition: usar `Bloqueada`, registrar razón y no fingir cierre.
11. Handoff: archivos, comandos **realmente** ejecutados y su resultado, validación de navegador si aplica, riesgos, desviaciones.
12. Cerrar el chat. El siguiente empieza en frío con la siguiente TASK.

Los estados versionados se exigen desde TASK-025. No se infiere ni reescribe el
estado histórico de TASK-001–024 a partir de sus checkboxes.

## Prohibido

- Refactors no solicitados, nuevas dependencias, cambios de API, implementar TASK futuras.
- Modificar ADRs «de paso». Si la implementación exige cambiar una decisión: **stop condition** — documentar y preguntar.
- Afirmar que los tests pasan si no se corrieron.
- Crear subagentes personalizados para trabajo rutinario.

## Subagentes

No hay subagentes de proyecto en `.cursor/agents/`.

Un verificador **readonly** es opcional en TASK de alto riesgo (export, E2E, release, gates post-024):

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
- El spike de export falla de forma **nueva** en un navegador soportado (TASK-008 ya corrió; degradación WebKit de `marker-end` aceptada).

## Prompts

Chat nuevo:

```text
Implementa @ruta/canónica/TASK-NNN.md.
Inspecciona archivos citados, resume un plan breve y respeta «Fuera del alcance».
No cambies dependencias ni ADRs.
Termina con los comandos de la TASK y un handoff.
```

Grok 4.6 en el model picker. No adjuntar el canvas de planificación.
