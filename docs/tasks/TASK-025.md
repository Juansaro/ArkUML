# TASK-025: Habilitar el árbol oficial post-024

## Estado documental

Hecha

## Objetivo

Crear el sistema de contexto que permite continuar después de TASK-024 con
rutas anidadas, gates explícitos, estado verificable y trazabilidad completa
de la auditoría documental.

## Prioridad

P0

## Dependencias

TASK-023. TASK-024 debe existir como contrato, pero su implementación no
bloquea esta tarea documental.

## Contexto obligatorio

- @docs/product/mvp-spec.md (NFR-09 y fuera de alcance)
- @docs/architecture/architecture.md (evolución y documentos canónicos)
- @docs/development/agent-workflow.md
- @docs/development/task-template.md
- @docs/tasks/README.md

## Estado inicial

TASK-001–024 viven en una carpeta plana y el workflow asume
`docs/tasks/TASK-NNN.md`. Las TASK contienen criterios `[ ]`, pero no existe un
protocolo versionado que diferencie contrato listo, trabajo en curso, bloqueo y
cierre demostrado. La auditoría encontró 49 hallazgos; 94 criterios de las
TASK históricas siguen sin firma, lo cual no demuestra por sí solo que haya 94
features pendientes.

## Dentro del alcance

- Mantener TASK-001–024 en sus rutas actuales y declarar su estado documental
  como legado no inferible, sin reescribirlas.
- Crear `docs/tasks/post-024/` como índice oficial para TASK-026+.
- Permitir rutas `docs/tasks/post-024/<fase>/TASK-NNN.md` en workflow y
  plantilla, sin stubs ni contratos duplicados.
- Definir estados `Lista`, `En curso`, `Bloqueada` y `Hecha`; `Propuesta`,
  `Condicional` y `Fuera de alcance vigente` solo existen en el roadmap, no
  como archivos TASK ejecutables.
- Versionar evidencia mínima de cierre: fecha, criterios marcados, comandos
  realmente ejecutados y referencia a commit/PR/handoff cuando exista.
- Crear registro de riesgos, roadmap completo y TASK-026–033.
- Actualizar el índice raíz para enlazar el árbol anidado y expresar el orden
  post-024 como DAG gobernado por dependencias y gates.

## Fuera del alcance

- Implementar TASK-024 o cualquier feature de producto.
- Marcar retroactivamente TASK-001–024 como hechas.
- Resolver los riesgos, decisiones o ambigüedades inventariados.
- Crear TASK-034+ antes de que TASK-033 congele una wave.
- Cambiar MVP, ADR, modelo persistido, dependencias o código.

## Archivos / módulos afectados

- `docs/tasks/TASK-025.md`
- `docs/tasks/README.md`
- `docs/development/agent-workflow.md`
- `docs/development/task-template.md`
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/risk-register.md`
- `docs/tasks/post-024/roadmap.md`
- `docs/tasks/post-024/10-release/TASK-026.md` … `TASK-030.md`
- `docs/tasks/post-024/11-governance/TASK-031.md` … `TASK-033.md`

## Cambios esperados

Un chat nuevo puede localizar y ejecutar exactamente una TASK anidada, saber
su estado, actualizar evidencia sin tocar contratos ajenos y distinguir deuda
activa, decisiones bloqueadas, contingencias y Post-MVP aún no autorizado.

## Restricciones

- Un ID global corresponde a un único archivo; no crear aliases planos.
- Una TASK anidada lista su propio archivo y
  `docs/tasks/post-024/README.md` entre los archivos autorizados para registrar
  estado/evidencia.
- Los hallazgos conversacionales se registran como evidencia no versionada
  hasta que exista una referencia comprobable.
- Los números de línea del registro son una fotografía de auditoría; la ruta y
  cita mandan si ediciones posteriores desplazan líneas.
- `mvp-spec.md` y ADRs siguen ganando sobre el roadmap.

## Criterios de aceptación

- [x] El índice raíz enlaza TASK-025 y el árbol post-024 sin romper TASK-001–024.
- [x] Workflow y plantilla aceptan rutas anidadas y definen transición de
      estado, bloqueo y cierre.
- [x] El registro dispone los 49 hallazgos sin convertir criterios sin firma en
      features.
- [x] El roadmap incluye todo Post-MVP y separa propuestas, contingencias y
      exclusiones vigentes.
- [x] TASK-026–033 son contratos únicos, numerados, enlazados y ejecutables en
      frío; TASK-034+ no existe.
- [x] Cada hallazgo termina en una TASK, decisión humana, contingencia o
      aceptación explícita.

## Tests

- Buscar recursivamente `docs/tasks/**/TASK-*.md` y comprobar IDs/rutas únicos.
- Comprobar que todos los enlaces locales y contextos obligatorios existen.
- Revisar que ninguna TASK futura contradiga el MVP o autorice un ADR «de
  paso».

## Comandos de verificación

```bash
npm run format:check
git diff --check
```

## Stop conditions

- Hace falta mover o duplicar TASK-001–024.
- Un hallazgo no puede clasificarse sin una decisión humana.
- Una TASK de implementación futura necesita inventar semántica UML,
  persistencia, exportación o dependencia.

## Definition of Done

Árbol anidado, protocolo, registros y TASK-026–033 versionables; numeración y
enlaces verificados; ninguna feature implementada ni contrato especulativo
promovido.

## Evidencia de cierre

2026-09-09. Criterios comprobados: índice raíz, workflow, plantilla,
`docs/tasks/post-024/README.md`, registro (R-01–15, P-01–12, A-01–12,
O-01–10 = 49), roadmap fases 12–17 + contingencias, contratos
`TASK-026`–`TASK-033`. Glob `docs/tasks/**/TASK-*.md`: IDs 001–033 únicos;
no hay TASK-034+ ni carpetas 12–17. Enlaces `@docs/` resuelven; artefactos
futuros (`post-mvp-spec.md`, `schema-evolution.md`) y globs de plantilla no
son rutas actuales. Ajustes de contrato: TASK-033 lista su propio archivo;
TASK-032 no dispone P-11 (eso es TASK-028); TASK-031 para si 030 no está
`Hecha`. Comandos: `npm run format:check`, `git diff --check`. No se
implementó producto ni se marcaron TASK-001–024 como hechas.
