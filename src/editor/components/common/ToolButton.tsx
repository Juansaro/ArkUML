import type {
  ButtonHTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  Ref,
} from "react";
import { Icon } from "./Icon.tsx";
import type { IconName } from "./icons.tsx";
import { useTooltipTrigger, type TooltipPlacement } from "./Tooltip.tsx";
import styles from "./ToolButton.module.css";

export type ToolButtonProps = {
  ref?: Ref<HTMLButtonElement> | undefined;
  icon: IconName;
  label: string;
  description: string;
  placement: TooltipPlacement;
  variant?: "icon" | "row";
  pressed?: boolean;
  unavailable?: boolean;
  onClick?: () => void;
} & Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-haspopup" | "aria-expanded" | "aria-controls"
>;

export function ToolButton({
  ref,
  icon,
  label,
  description,
  placement,
  variant = "icon",
  pressed,
  unavailable = false,
  onClick,
  "aria-haspopup": ariaHasPopup,
  "aria-expanded": ariaExpanded,
  "aria-controls": ariaControls,
}: ToolButtonProps) {
  const tooltip = useTooltipTrigger(description, placement);

  function preventIfUnavailable(
    event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
  ) {
    if (!unavailable) {
      return false;
    }
    if ("key" in event && event.key !== "Enter" && event.key !== " ") {
      return false;
    }
    event.preventDefault();
    return true;
  }

  const pressedProps = pressed === undefined ? {} : { "aria-pressed": pressed };
  const popupProps =
    ariaHasPopup === undefined ? {} : { "aria-haspopup": ariaHasPopup };
  const expandedProps =
    ariaExpanded === undefined ? {} : { "aria-expanded": ariaExpanded };
  const controlsProps =
    ariaControls === undefined ? {} : { "aria-controls": ariaControls };

  return (
    <button
      ref={(node) => {
        tooltip.ref(node);
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      type="button"
      className={`${styles.button} ${variant === "row" ? styles.row : styles.icon}`}
      {...(variant === "icon" ? { "aria-label": label } : {})}
      {...(unavailable ? { "aria-disabled": true as const } : {})}
      {...pressedProps}
      {...popupProps}
      {...expandedProps}
      {...controlsProps}
      onMouseEnter={tooltip.onMouseEnter}
      onMouseLeave={tooltip.onMouseLeave}
      onFocus={tooltip.onFocus}
      onBlur={tooltip.onBlur}
      {...(tooltip["aria-describedby"] === undefined
        ? {}
        : { "aria-describedby": tooltip["aria-describedby"] })}
      onClick={(event) => {
        if (preventIfUnavailable(event)) {
          return;
        }
        onClick?.();
      }}
      onKeyDown={preventIfUnavailable}
    >
      <Icon name={icon} />
      {variant === "row" ? label : null}
    </button>
  );
}
