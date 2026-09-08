# Plantilla de tarea

Copia este esqueleto. Cada TASK real debe poder ejecutarse **sin** reabrir decisiones de ADR.

```markdown
# TASK-NNN: título

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
```

Campos alineados con el backlog. No añadir prosa de arquitectura aquí: enlazar.
