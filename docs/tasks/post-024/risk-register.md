# Registro de riesgos y trazabilidad post-024

Fotografía de la auditoría documental que originó TASK-025. No audita código,
Git, CI ni navegadores. Las líneas son referencias de la fotografía; si se
desplazan, mandan la ruta y la cita.

## Interpretación

- **Riesgo:** exposición real o limitación aceptada.
- **Pendiente:** contrato/evidencia explícitamente abierta o estado que los
  docs no permiten inferir.
- **Ambigüedad:** dos fuentes incompatibles o decisión sin dueño.
- **Fuera de alcance:** exclusión deliberada; se traza al roadmap, no se
  convierte automáticamente en deuda.

Se contaron 49 hallazgos: 15 riesgos, 12 pendientes, 12 ambigüedades y 10
grupos fuera de alcance.

## Riesgos

| ID | Sev. | Hallazgo | Fuente | Disposición |
| --- | --- | --- | --- | --- |
| R-01 | Alta | `marker-end` intermitente en Safari/WebKit | `docs/architecture/rendering-and-export.md:55-67`; `README.md:68` | TASK-029 mide/acepta; fase 15 si se reabre export |
| R-02 | Alta | Export 2x cerca de 3 s; estrés 200/300 no medido | `docs/architecture/performance.md:30,48-54` | TASK-029 |
| R-03 | Alta | Techo 4096 px/16 MP, `foreignObject` y pin `html-to-image@1.11.11` | `docs/decisions/ADR-006-export.md:5-7`; `docs/architecture/rendering-and-export.md:46-69` | Aceptación TASK-029; gate fase 15 |
| R-04 | Alta | Canvas no equivalente para lector de pantalla | `docs/product/mvp-spec.md:171-181`; `README.md:66` | Honestidad TASK-026; propuesta fase 16 |
| R-05 | Alta | Cuota/corrupción, `beforeunload` best-effort y último write multi-tab | `docs/decisions/ADR-004-persistence.md:25-39`; `docs/product/mvp-spec.md:152` | Medición TASK-029; propuesta fase 14 |
| R-06 | Media | Sin virtualización; X6/Konva solo tras incumplimiento medido | `docs/architecture/performance.md:50-52`; `docs/decisions/ADR-002-diagram-engine.md:28-45` | Contingencia fase 17 |
| R-07 | Media | Baselines ligados a Windows; cobertura desigual por browser | `docs/architecture/testing-strategy.md:46-47`; `README.md:69` | TASK-026/028 |
| R-08 | Media | `interactionWidth` 24 px puede tapar nodos en automatización | `docs/architecture/performance.md:53`; `docs/tasks/TASK-021.md:23-30` | TASK-026/029 |
| R-09 | Media | Ciclos Include/Extend no se validan | `docs/product/mvp-spec.md:98`; `docs/tasks/TASK-022.md:32-35` | Propuesta fase 12 |
| R-10 | Alta | No hay licencia de proyecto aprobada | `docs/product/brand-system.md:23-26,447` | TASK-027 |
| R-11 | Alta | Pins, modelo, ADR y scope activan stop conditions | `docs/development/agent-workflow.md:63-70`; `docs/tasks/TASK-024.md:179-186` | Protocolo TASK-025 |
| R-12 | Media | Edición bajo 768 px y touch no soportados | `docs/product/mvp-spec.md:48-53,175` | Limitación TASK-026; propuesta fase 16 |
| R-13 | Baja | Undo no restaura viewport/selección; historial máximo 100 | `docs/decisions/ADR-003-state-management.md:37-38` | Aceptado; reconsiderable por TASK-031 |
| R-14 | Baja | Tipografía exportada depende de fuentes locales | `docs/decisions/ADR-006-export.md:40` | Aceptado; fase 15 si cambia |
| R-15 | Media | Umbrales CI de rendimiento no son SLO | `docs/architecture/performance.md:16-18` | TASK-029 |

## Pendientes y estado incierto

| ID | Sev. | Hallazgo | Fuente | Disposición |
| --- | --- | --- | --- | --- |
| P-01 | Alta | TASK-021 no firma pan, reparent, resize, visor y browsers | `docs/tasks/TASK-021.md:5,53-56` | TASK-026 |
| P-02 | Alta | TASK-022 describe FR-07 abierto en inspector | `docs/tasks/TASK-022.md:20-29,54-56` | Verificar y reconciliar en TASK-026/028 |
| P-03 | Alta | TASK-024 exige marca, tooltip, favicon, a11y y baselines | `docs/tasks/TASK-024.md:33-47,137-153` | Ejecutar TASK-024 antes de TASK-026 |
| P-04 | Media | TASK-023 tiene artefacto, pero no cierre contractual | `docs/tasks/TASK-023.md:81-98`; `docs/product/brand-system.md:1-6` | TASK-028 registra evidencia |
| P-05 | Alta | Checklist README no identifica firma, fecha ni browsers | `docs/tasks/README.md:20-23`; `README.md:72-82` | TASK-026 |
| P-06 | Media | Export 2x 200/300 no medido | `docs/tasks/TASK-019.md:27,59`; `docs/architecture/performance.md:48` | TASK-029 |
| P-07 | Media | Tamaño JSON/snapshot e historial no publicado | `docs/decisions/ADR-003-state-management.md:37`; `ADR-004-persistence.md:37` | TASK-029 |
| P-08 | Media | Cobertura de dominio sin cifra publicada | `docs/architecture/testing-strategy.md:18-20` | TASK-029 |
| P-09 | Alta | 94 criterios TASK sin firma no equivalen a 94 features | `docs/tasks/TASK-001.md:57` y `TASK-*.md`; dos placeholders en `task-template.md:37-38` | Protocolo TASK-025 |
| P-10 | Alta | TASK-001–020 no tienen estado formal | `docs/development/task-template.md:1-58`; `README.md:94-97` | TASK-025/028; no inferir retroactivamente |
| P-11 | Media | Cierres conversacionales de 022/023 no están versionados | `docs/tasks/TASK-022.md:54-56`; `TASK-023.md:81-92` | TASK-028 exige evidencia comprobable |
| P-12 | Alta | «Pulido post-RC» no define si bloquea ship | `docs/product/mvp-spec.md:36,50`; `docs/tasks/README.md:23` | TASK-028 decide; TASK-030 aplica |

## Ambigüedades y contradicciones

| ID | Sev. | Hallazgo | Fuente | Disposición |
| --- | --- | --- | --- | --- |
| A-01 | Alta | TASK-020 afirma P0/P1 hechos; existen P1 021–024 | `docs/tasks/TASK-020.md:59`; `docs/tasks/README.md:49-52` | TASK-028 |
| A-02 | Alta | README declara RC; gate 8/checklist no está firmado | `README.md:95`; `docs/tasks/README.md:22`; `TASK-021.md:5` | TASK-026/028/030 |
| A-03 | Media | ADR-005 usa dev server; README/CI usan `vite preview` | `docs/decisions/ADR-005-testing.md:24`; `README.md:25`; `TASK-021.md:22-27` | TASK-028; reabrir ADR si cambia decisión |
| A-04 | Alta | Architecture/workflow hablan de fase sin código y llegan a TASK-022 | `docs/architecture/architecture.md:23,120-128`; `agent-workflow.md:42-49` | TASK-028 |
| A-05 | Media | `domain-model` define warning más estricto que `mvp-spec` | `docs/architecture/domain-model.md:81-84`; `docs/product/mvp-spec.md:115-116` | TASK-028; manda spec |
| A-06 | Media | `/favicon.svg` absoluto contradice `base: "./"` | `docs/product/brand-system.md:81`; `README.md:15` | TASK-028 y corrección en TASK-024 si aplica |
| A-07 | Media | Fixture 200/300 es opcional y obligatorio | `docs/tasks/TASK-019.md:27,59` | TASK-028/029 |
| A-08 | Media | Orden lineal contradice dependencias paralelizables | `docs/tasks/README.md:3-7`; `TASK-007.md:11-13` | TASK-025: DAG post-024; legado no reescrito |
| A-09 | Alta | No existe protocolo documental de cierre | `docs/development/task-template.md:37-58`; `agent-workflow.md:53-61` | TASK-025 |
| A-10 | Media | Claim «Documentación completa» no es verificable | `README.md:94`; `docs/architecture/architecture.md:120-128` | TASK-028 |
| A-11 | Baja | Estado idle «—» vive fuera de spec canónica | `README.md:67,76`; `docs/product/mvp-spec.md:46` | TASK-028 |
| A-12 | Baja | Gate del spike sigue en futuro aunque ya fue ejecutado | `docs/decisions/README.md:12`; `docs/architecture/rendering-and-export.md:55-67` | TASK-028 |

## Fuera de alcance vigente

| ID | Grupo | Fuente | Tratamiento en roadmap |
| --- | --- | --- | --- |
| O-01 | Generalization, ciclos, extension points, notas, paquetes, multiplicidad, actores especializados y otros diagramas | `docs/product/mvp-spec.md:66-70,192-205` | Fases 12 y 17 |
| O-02 | Minimap, auto-layout, alignment guides, waypoints y routing | `docs/product/mvp-spec.md:50,192-205` | Fase 13 |
| O-03 | Multi-documento, IndexedDB, sync y workspace remoto | `docs/product/mvp-spec.md:192-205`; `ADR-004-persistence.md:37` | Fases 14 y 17 |
| O-04 | PDF, SVG persistido, clipboard e import/export JSON | `docs/product/mvp-spec.md:192-205` | Fases 14 y 15 |
| O-05 | Dark mode, temas, webfonts y animación de marca | `docs/product/brand-system.md:444-450`; `TASK-024.md:49-58` | Fase 16 |
| O-06 | Editor paralelo/semántico para lector de pantalla | `docs/product/mvp-spec.md:171-181` | Fase 16 |
| O-07 | Touch y edición móvil | `docs/product/mvp-spec.md:48-53,192-205` | Fase 16 |
| O-08 | Backend, auth, colaboración, hosting, analytics, SaaS y PWA | `docs/product/mvp-spec.md:192-205` | Fase 17, tras gates de producto/privacidad |
| O-09 | Husky, lint-staged, commitlint, Jest, Cypress, Tailwind, shadcn, Router y TS7 | `docs/decisions/ADR-001-frontend-stack.md:41-49`; `ADR-005-testing.md:35-41` | Fase 17 o exclusión permanente |
| O-10 | X6/Konva, Canvas/WebGL, DI, event bus, Redux y arquitectura ceremonial | `docs/architecture/architecture.md:108-118`; `ADR-002-diagram-engine.md:28-45` | Contingencia medida, no trabajo programado |

## Cobertura

Cada ID tiene exactamente una disposición primaria. TASK-030 no puede cerrar
si R/P/A de severidad alta sigue sin decisión, evidencia o aceptación
explícita. TASK-031 puede promover O-01–O-10, pero hasta entonces siguen fuera
del alcance vigente.
