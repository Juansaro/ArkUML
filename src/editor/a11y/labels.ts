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
  return "Extend";
}

export function elementAccessibleName(
  element: Pick<DiagramElement, "kind" | "name">,
  selected = false,
): string {
  const base = `${elementTypeLabel(element.kind)} ${element.name}`;
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
