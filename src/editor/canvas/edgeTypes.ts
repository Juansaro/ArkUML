import type { EdgeTypes } from "@xyflow/react";
import { AssociationEdge } from "../edges/AssociationEdge.tsx";
import { PlaceholderEdge } from "./PlaceholderEdge.tsx";

export const edgeTypes = {
  association: AssociationEdge,
  include: PlaceholderEdge,
  extend: PlaceholderEdge,
} satisfies EdgeTypes;
