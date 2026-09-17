import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { InlineNameEditor } from "./InlineNameEditor.tsx";
import { handleHostClassName, NodeHandles } from "./NodeHandles.tsx";
import styles from "./ClassNode.module.css";

function ClassNodeView({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<DiagramNode>) {
  const attributes = data.attributes ?? [];
  const operations = data.operations ?? [];

  return (
    <div
      className={`${styles.node} ${handleHostClassName}`}
      data-kind={data.kind}
      data-selected={selected ? "true" : "false"}
      data-testid={`diagram-node-${id}`}
      style={{ width, height }}
    >
      <div className={styles.box} data-testid="class-box">
        <div
          className={`${styles.compartment} ${styles.name}`}
          data-testid="class-compartment-name"
        >
          <InlineNameEditor
            id={id}
            name={data.name}
            className={styles.nameText}
            editing={data.editing === true}
          />
        </div>
        <div
          className={`${styles.compartment} ${styles.attributes}`}
          data-testid="class-compartment-attributes"
        >
          <MemberList items={attributes} />
        </div>
        <div
          className={`${styles.compartment} ${styles.operations}`}
          data-testid="class-compartment-operations"
        >
          <MemberList items={operations} />
        </div>
      </div>
      <NodeHandles />
    </div>
  );
}

function MemberList({ items }: { items: readonly string[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className={styles.members}>
      {items.map((item, index) => (
        <li key={`${index}:${item}`} className={styles.member}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export const ClassNode = memo(ClassNodeView);
