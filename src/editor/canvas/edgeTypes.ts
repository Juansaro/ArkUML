import type { EdgeTypes } from "@xyflow/react";
import { AssociationEdge } from "../edges/AssociationEdge.tsx";
import { DependencyEdge } from "../edges/DependencyEdge.tsx";

export const edgeTypes = {
  association: AssociationEdge,
  include: DependencyEdge,
  extend: DependencyEdge,
} satisfies EdgeTypes;
