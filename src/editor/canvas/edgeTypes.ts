import type { EdgeTypes } from "@xyflow/react";
import { AssociationEdge } from "../edges/AssociationEdge.tsx";
import { ClassRelationshipEdge } from "../edges/ClassRelationshipEdge.tsx";
import { ComponentRelationshipEdge } from "../edges/ComponentRelationshipEdge.tsx";
import { DependencyEdge } from "../edges/DependencyEdge.tsx";
import { DeploymentRelationshipEdge } from "../edges/DeploymentRelationshipEdge.tsx";
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
  "component-usage": ComponentRelationshipEdge,
  "assembly-connector": ComponentRelationshipEdge,
  "communication-path": DeploymentRelationshipEdge,
  deploy: DeploymentRelationshipEdge,
} satisfies EdgeTypes;
