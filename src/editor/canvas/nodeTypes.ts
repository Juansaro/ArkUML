import type { NodeTypes } from "@xyflow/react";
import { ActorNode } from "../nodes/ActorNode.tsx";
import { LifelineNode } from "../nodes/LifelineNode.tsx";
import { SystemBoundaryNode } from "../nodes/SystemBoundaryNode.tsx";
import { UseCaseNode } from "../nodes/UseCaseNode.tsx";

export const nodeTypes = {
  actor: ActorNode,
  "use-case": UseCaseNode,
  "system-boundary": SystemBoundaryNode,
  lifeline: LifelineNode,
} satisfies NodeTypes;
