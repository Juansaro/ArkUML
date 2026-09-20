import type { NodeTypes } from "@xyflow/react";
import { ActorNode } from "../nodes/ActorNode.tsx";
import { ArtifactNode } from "../nodes/ArtifactNode.tsx";
import { AttributeNode } from "../nodes/AttributeNode.tsx";
import { ClassNode } from "../nodes/ClassNode.tsx";
import { ComponentNode } from "../nodes/ComponentNode.tsx";
import { DeploymentNode } from "../nodes/DeploymentNode.tsx";
import { EntityNode } from "../nodes/EntityNode.tsx";
import { ErRelationshipNode } from "../nodes/ErRelationshipNode.tsx";
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
} satisfies NodeTypes;
