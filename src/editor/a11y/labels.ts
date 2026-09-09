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
  return "Límite del sistema";
}

export function relationshipTypeLabel(kind: RelationshipKind): string {
  if (kind === "association") {
    return "Asociación";
  }
  if (kind === "include") {
    return "Include";
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
