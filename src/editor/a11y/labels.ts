import type {
  DiagramElement,
  RelationshipKind,
} from "../../domain/diagram/model.ts";

export function elementTypeLabel(kind: DiagramElement["kind"]): string {
  if (kind === "actor") {
    return "Actor";
  }
  if (kind === "use-case") {
    return "Caso de uso";
  }
  if (kind === "lifeline") {
    return "Lifeline";
  }
  if (kind === "class") {
    return "Clase";
  }
  if (kind === "component") {
    return "Componente";
  }
  if (kind === "node") {
    return "Nodo";
  }
  if (kind === "artifact") {
    return "Artefacto";
  }
  if (kind === "entity") {
    return "Entidad";
  }
  if (kind === "attribute") {
    return "Atributo";
  }
  if (kind === "er-relationship") {
    return "Relación";
  }
  if (kind === "action") {
    return "Acción";
  }
  if (kind === "initial-node") {
    return "Inicial";
  }
  if (kind === "activity-final") {
    return "Final";
  }
  if (kind === "decision-node") {
    return "Decisión";
  }
  if (kind === "merge-node") {
    return "Fusión";
  }
  if (kind === "fork-node") {
    return "Fork";
  }
  if (kind === "join-node") {
    return "Join";
  }
  if (kind === "interaction-occurrence") {
    return "Interacción";
  }
  return "Límite del sistema";
}

export function relationshipTypeLabel(kind: RelationshipKind): string {
  if (kind === "association" || kind === "class-association") {
    return "Asociación";
  }
  if (kind === "include") {
    return "Include";
  }
  if (kind === "sync-message") {
    return "Mensaje síncrono";
  }
  if (kind === "reply-message") {
    return "Reply";
  }
  if (kind === "aggregation") {
    return "Agregación";
  }
  if (kind === "composition") {
    return "Composición";
  }
  if (kind === "generalization") {
    return "Generalización";
  }
  if (kind === "component-usage") {
    return "Uso";
  }
  if (kind === "assembly-connector") {
    return "Ensamblaje";
  }
  if (kind === "communication-path") {
    return "Camino de comunicación";
  }
  if (kind === "deploy") {
    return "Deploy";
  }
  if (kind === "er-link") {
    return "Enlace";
  }
  if (kind === "control-flow") {
    return "Flujo de control";
  }
  return "Extend";
}

export function elementAccessibleName(
  element: Pick<DiagramElement, "kind" | "name">,
  selected = false,
): string {
  const type = elementTypeLabel(element.kind);
  const base =
    element.name.trim().length === 0 ? type : `${type} ${element.name}`;
  return selected ? `${base}, seleccionado` : base;
}

export function relationshipAccessibleName(
  kind: RelationshipKind,
  sourceName: string,
  targetName: string,
  selected = false,
): string {
  const base = `${relationshipTypeLabel(kind)} entre ${sourceName} y ${targetName}`;
  return selected ? `${base}, seleccionada` : base;
}
