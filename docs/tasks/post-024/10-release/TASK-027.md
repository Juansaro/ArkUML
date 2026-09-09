# TASK-027: Licencia de proyecto

## Estado documental

Lista

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

- [ ] Existe una decisión humana registrada en la evidencia de cierre.
- [ ] `LICENSE` (o equivalente) está versionada, **o** el copy Open Source
      quedó retirado de README/brand-system.
- [ ] README enlaza la licencia de proyecto y mantiene deps + atribución RF.
- [ ] Índice post-024 actualizado.

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

Pendiente. Debe citar quién eligió qué licencia (o la orden de no afirmar).
