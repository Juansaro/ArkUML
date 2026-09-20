import type { NodeTypes } from "@xyflow/react";
import { ActionNode } from "../nodes/ActionNode.tsx";
import { ActivityFinalNode } from "../nodes/ActivityFinalNode.tsx";
import { ActorNode } from "../nodes/ActorNode.tsx";
import { ArtifactNode } from "../nodes/ArtifactNode.tsx";
import { AttributeNode } from "../nodes/AttributeNode.tsx";
import { ClassNode } from "../nodes/ClassNode.tsx";
import { ComponentNode } from "../nodes/ComponentNode.tsx";
import { DecisionNode } from "../nodes/DecisionNode.tsx";
import { DeploymentNode } from "../nodes/DeploymentNode.tsx";
import { EntityNode } from "../nodes/EntityNode.tsx";
import { ErRelationshipNode } from "../nodes/ErRelationshipNode.tsx";
import { ForkNode } from "../nodes/ForkNode.tsx";
import { InitialNode } from "../nodes/InitialNode.tsx";
import { LifelineNode } from "../nodes/LifelineNode.tsx";
import { SystemBoundaryNode } from "../nodes/SystemBoundaryNode.tsx";
import { UseCaseNode } from "../nodes/UseCaseNode.tsx";

export const nodeTypes = {
  actor: ActorNode,
  "use-case": UseCaseNode,
  "system-boundary": SystemBoundaryNode,
  lifeline: LifelineNode,
  class: ClassNode,
  component: ComponentNode,
  node: DeploymentNode,
  artifact: ArtifactNode,
  entity: EntityNode,
  attribute: AttributeNode,
  "er-relationship": ErRelationshipNode,
  action: ActionNode,
  "initial-node": InitialNode,
  "activity-final": ActivityFinalNode,
  "decision-node": DecisionNode,
  "merge-node": DecisionNode,
  "fork-node": ForkNode,
  "join-node": ForkNode,
} satisfies NodeTypes;
