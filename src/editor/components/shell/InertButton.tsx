import { ToolButton } from "../common/ToolButton.tsx";
import type { IconName } from "../common/icons.tsx";

type InertButtonProps = {
  children: string;
  reason: string;
  icon: IconName;
};

export function InertButton({ children, reason, icon }: InertButtonProps) {
  return (
    <ToolButton
      variant="row"
      icon={icon}
      label={children}
      description={reason}
      placement="right"
      unavailable
    />
  );
}
