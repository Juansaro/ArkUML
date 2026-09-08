import type { EdgeTypes } from "@xyflow/react";
import { PlaceholderEdge } from "./PlaceholderEdge.tsx";

export const edgeTypes = {
  association: PlaceholderEdge,
  include: PlaceholderEdge,
  extend: PlaceholderEdge,
} satisfies EdgeTypes;
