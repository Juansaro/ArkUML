# TASK-027: Licencia de proyecto

## Estado documental

Hecha

## Objetivo

Decidir e incorporar una licencia de proyecto, o retirar cualquier afirmación
de «Open Source» hasta que exista esa decisión humana.

## Prioridad

P0

## Dependencias

TASK-025

## Contexto obligatorio

- @docs/product/brand-system.md (intención vs hecho legal)
- @README.md (sección Licencias)
- @docs/tasks/post-024/README.md

## Estado inicial

`brand-system.md` y TASK-023 prohíben usar «Open Source» como hecho hasta una
licencia aprobada. El README documenta licencias de **dependencias** (MIT de
runtime; axe MPL-2.0 solo dev) y la atribución visible de React Flow. No hay
`LICENSE` de proyecto en el árbol.

## Dentro del alcance

- Recoger una decisión humana explícita ( SPDX / texto de licencia ).
- Añadir `LICENSE` (o equivalente) y enlazarla desde README.
- Alinear copy de producto, brand-system y README: o bien se afirma Open
  Source con la licencia, o se elimina esa afirmación.
- Conservar la atribución de React Flow y la tabla de licencias de deps.
- Actualizar el índice post-024.

## Fuera del alcance

- Elegir la licencia **en lugar del humano** (stop).
- CLA, fundación, trademark o material de marketing.
- Cambiar dependencias o el pin de React Flow.
- Implementar features.

## Archivos / módulos afectados

- `LICENSE`
- `README.md`
- `docs/product/brand-system.md` (párrafo legal, sin rediseñar marca)
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/10-release/TASK-027.md`

## Cambios esperados

Quien clone el repo puede saber bajo qué términos usa ArkUML, o bien el
producto deja de insinuar Open Source.

## Restricciones

- La elección es humana y previa al archivo. El agente no inventa SPDX.
- No dual-license sin decisión explícita.
- No mezclar esta TASK con hosting, analytics o backend.

## Criterios de aceptación

- [x] Existe una decisión humana registrada en la evidencia de cierre.
- [x] `LICENSE` (o equivalente) está versionada, **o** el copy Open Source
      quedó retirado de README/brand-system.
- [x] README enlaza la licencia de proyecto y mantiene deps + atribución RF.
- [x] Índice post-024 actualizado.

## Tests

Revisión documental. No hay tests de producto.

## Comandos de verificación

```bash
npm run format:check
git diff --check
```

## Stop conditions

- Nadie elige la licencia y se pide «poner MIT por defecto».
- Se exige un CLA o entidad legal no definida.

## Definition of Done

Hecho legal o silencio legal, nunca una afirmación sin archivo.

## Evidencia de cierre

2026-09-09. Decisión humana: Juan Sarmiento eligió SPDX `Apache-2.0` (un solo
licenciamiento; no dual-license). Titular y año: Copyright 2026 Juan
Sarmiento. Texto canónico en `LICENSE` (Apache License 2.0, apéndice
cumplimentado). README afirma Open Source, enlaza `LICENSE` y conserva deps
MIT de runtime, atribución visible de React Flow y MPL-2.0 de axe (solo
dev). `brand-system.md` deja de tratar «Open Source» como intención: es
hecho legal bajo Apache-2.0. Índice post-024: TASK-027 `Hecha`. CLA,
fundación y trademark no forman parte de esta TASK.
