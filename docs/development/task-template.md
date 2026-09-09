# Plantilla de tarea

Copia este esqueleto. Cada TASK real debe poder ejecutarse **sin** reabrir decisiones de ADR.

```markdown
# TASK-NNN: título

## Estado documental
Lista | En curso | Bloqueada | Hecha

## Objetivo
Resultado observable único.

## Prioridad
P0 | P1

## Dependencias
TASK-… / ninguna

## Contexto obligatorio
- @docs/...
- @.cursor/rules/...

## Estado inicial
Qué debe existir ya. Qué commit/artefacto se asume.

## Dentro del alcance
- …

## Fuera del alcance
- …

## Archivos / módulos afectados
- rutas nuevas o existentes (autorizadas)
- el propio archivo TASK y su índice, para estado/evidencia

## Cambios esperados
- …

## Restricciones
- Pines, imports prohibidos, ADRs a respetar

## Criterios de aceptación
- [ ] observable
- [ ] observable

## Tests
- …

## Comandos de verificación
```bash
npm run check
```

## Stop conditions
- …

## Definition of Done
- Código, tests, docs de contrato si cambió, comandos ejecutados, sin scope creep

## Evidencia de cierre
Pendiente. Al cerrar: fecha, criterios comprobados, comandos realmente
ejecutados y commit/PR/handoff si existe.
```

Campos alineados con el backlog. No añadir prosa de arquitectura aquí:
enlazar.

## Protocolo post-024

- `Propuesta`, `Condicional` y `Fuera de alcance vigente` son estados del
  roadmap, no de una TASK. No crear el archivo hasta que un gate cierre sus
  decisiones.
- Crear una TASK equivale a declarar el contrato `Lista`: contexto, alcance,
  archivos, comportamiento, tests y stops están cerrados.
- Al empezar, TASK e índice pasan a `En curso`.
- Una stop condition deja ambos en `Bloqueada` y «Evidencia de cierre» explica
  la decisión pendiente.
- `Hecha` exige criterios `[x]` y evidencia versionada. Un chat, la existencia
  de código o un README que diga «RC» no sustituyen esa evidencia.
- TASK-001–024 son legado sin estado formal; no marcar retroactivamente sus
  checkboxes sin una tarea de reconciliación.
