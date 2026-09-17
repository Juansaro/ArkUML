import type { EdgeTypes } from "@xyflow/react";
import { AssociationEdge } from "../edges/AssociationEdge.tsx";
import { ClassRelationshipEdge } from "../edges/ClassRelationshipEdge.tsx";
import { DependencyEdge } from "../edges/DependencyEdge.tsx";
import { SequenceMessageEdge } from "../edges/SequenceMessageEdge.tsx";

export const edgeTypes = {
  association: AssociationEdge,
  include: DependencyEdge,
  extend: DependencyEdge,
  "sync-message": SequenceMessageEdge,
  "reply-message": SequenceMessageEdge,
  "class-association": ClassRelationshipEdge,
  aggregation: ClassRelationshipEdge,
  composition: ClassRelationshipEdge,
  generalization: ClassRelationshipEdge,
} satisfies EdgeTypes;
