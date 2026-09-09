import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefCallback,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.css";

export const TOOLTIP_SHOW_DELAY_MS = 400;
export const TOOLTIP_HIDE_DELAY_MS = 100;
export const TOOLTIP_GAP_PX = 8;
export const TOOLTIP_VIEWPORT_MARGIN_PX = 8;

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

type ActiveTooltip = {
  id: string;
  content: string;
  placement: TooltipPlacement;
  trigger: HTMLElement;
};

type TooltipContextValue = {
  activeId: string | undefined;
  show: (next: ActiveTooltip, delay: number) => void;
  hide: (id: string, delay: number) => void;
  hideNow: (id: string) => void;
  cancelHide: () => void;
};

const TooltipContext = createContext<TooltipContextValue | undefined>(
  undefined,
);

type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function positionTooltip(
  trigger: Box,
  tooltip: { width: number; height: number },
  placement: TooltipPlacement,
  viewport: { width: number; height: number },
  gap = TOOLTIP_GAP_PX,
  margin = TOOLTIP_VIEWPORT_MARGIN_PX,
): { top: number; left: number; placement: TooltipPlacement } {
  const preferred = coordsFor(trigger, tooltip, placement, gap);
  if (fits(preferred, tooltip, viewport, margin)) {
    return { ...preferred, placement };
  }

  const flipped = flip(placement);
  const opposite = coordsFor(trigger, tooltip, flipped, gap);
  if (fits(opposite, tooltip, viewport, margin)) {
    return { ...opposite, placement: flipped };
  }

  const clamped = clamp(preferred, tooltip, viewport, margin);
  return { ...clamped, placement };
}

function coordsFor(
  trigger: Box,
  tooltip: { width: number; height: number },
  placement: TooltipPlacement,
  gap: number,
): { top: number; left: number } {
  const centerX = trigger.left + (trigger.width - tooltip.width) / 2;
  const centerY = trigger.top + (trigger.height - tooltip.height) / 2;
  if (placement === "bottom") {
    return { top: trigger.top + trigger.height + gap, left: centerX };
  }
  if (placement === "top") {
    return { top: trigger.top - gap - tooltip.height, left: centerX };
  }
  if (placement === "right") {
    return { top: centerY, left: trigger.left + trigger.width + gap };
  }
  return { top: centerY, left: trigger.left - gap - tooltip.width };
}

function flip(placement: TooltipPlacement): TooltipPlacement {
  if (placement === "bottom") {
    return "top";
  }
  if (placement === "top") {
    return "bottom";
  }
  if (placement === "right") {
    return "left";
  }
  return "right";
}

function fits(
  coords: { top: number; left: number },
  tooltip: { width: number; height: number },
  viewport: { width: number; height: number },
  margin: number,
): boolean {
  return (
    coords.top >= margin &&
    coords.left >= margin &&
    coords.top + tooltip.height <= viewport.height - margin &&
    coords.left + tooltip.width <= viewport.width - margin
  );
}

function clamp(
  coords: { top: number; left: number },
  tooltip: { width: number; height: number },
  viewport: { width: number; height: number },
  margin: number,
): { top: number; left: number } {
  const maxLeft = Math.max(margin, viewport.width - margin - tooltip.width);
  const maxTop = Math.max(margin, viewport.height - margin - tooltip.height);
  return {
    left: Math.min(Math.max(coords.left, margin), maxLeft),
    top: Math.min(Math.max(coords.top, margin), maxTop),
  };
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveTooltip | undefined>(undefined);
  const [coords, setCoords] = useState<{ top: number; left: number }>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef(0);
  const hideTimer = useRef(0);
  const activeRef = useRef<ActiveTooltip | undefined>(undefined);

  const clearTimers = useCallback(() => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);
    showTimer.current = 0;
    hideTimer.current = 0;
  }, []);

  const show = useCallback((next: ActiveTooltip, delay: number) => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = 0;
    window.clearTimeout(showTimer.current);
    const current = activeRef.current;
    if (current !== undefined && current.id !== next.id) {
      activeRef.current = undefined;
      setActive(undefined);
      setCoords(undefined);
    }
    if (delay === 0) {
      showTimer.current = 0;
      activeRef.current = next;
      setActive(next);
      return;
    }
    showTimer.current = window.setTimeout(() => {
      showTimer.current = 0;
      activeRef.current = next;
      setActive(next);
    }, delay);
  }, []);

  const hideNow = useCallback((id: string) => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);
    showTimer.current = 0;
    hideTimer.current = 0;
    if (activeRef.current?.id === id) {
      activeRef.current = undefined;
    }
    setActive((current) => (current?.id === id ? undefined : current));
    setCoords(undefined);
  }, []);

  const hide = useCallback((id: string, delay: number) => {
    window.clearTimeout(showTimer.current);
    showTimer.current = 0;
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = 0;
      if (activeRef.current?.id === id) {
        activeRef.current = undefined;
      }
      setActive((current) => (current?.id === id ? undefined : current));
      setCoords(undefined);
    }, delay);
  }, []);

  const cancelHide = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = 0;
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || activeRef.current === undefined) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      clearTimers();
      activeRef.current = undefined;
      setActive(undefined);
      setCoords(undefined);
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useLayoutEffect(() => {
    if (active === undefined) {
      return;
    }
    const node = tooltipRef.current;
    if (node === null) {
      return;
    }
    const trigger = active.trigger.getBoundingClientRect();
    const tooltip = node.getBoundingClientRect();
    const next = positionTooltip(
      {
        top: trigger.top,
        left: trigger.left,
        width: trigger.width,
        height: trigger.height,
      },
      { width: tooltip.width, height: tooltip.height },
      active.placement,
      { width: window.innerWidth, height: window.innerHeight },
    );
    setCoords({ top: next.top, left: next.left });
  }, [active]);

  const value: TooltipContextValue = {
    activeId: active?.id,
    show,
    hide,
    hideNow,
    cancelHide,
  };

  return (
    <TooltipContext.Provider value={value}>
      {children}
      {active !== undefined
        ? createPortal(
            <div
              ref={tooltipRef}
              id={active.id}
              role="tooltip"
              data-testid="editor-tooltip"
              data-placement={active.placement}
              className={styles.tooltip}
              style={{
                top: coords?.top ?? 0,
                left: coords?.left ?? 0,
                visibility: coords === undefined ? "hidden" : "visible",
              }}
              onMouseEnter={cancelHide}
              onMouseLeave={() => {
                hide(active.id, TOOLTIP_HIDE_DELAY_MS);
              }}
            >
              {active.content}
            </div>,
            document.body,
          )
        : null}
    </TooltipContext.Provider>
  );
}

function useTooltipContext(): TooltipContextValue {
  const context = useContext(TooltipContext);
  if (context === undefined) {
    throw new Error("Tooltip must be used within TooltipProvider");
  }
  return context;
}

export type TooltipTriggerBind = {
  ref: RefCallback<HTMLElement>;
  onMouseEnter: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave: (event: MouseEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
  "aria-describedby"?: string;
};

export function useTooltipTrigger(
  content: string,
  placement: TooltipPlacement,
): TooltipTriggerBind {
  const id = useId();
  const nodeRef = useRef<HTMLElement | null>(null);
  const { activeId, show, hide, hideNow } = useTooltipContext();
  const open = activeId === id;

  const ref = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  const reveal = useCallback(
    (delay: number) => {
      const trigger = nodeRef.current;
      if (trigger === null) {
        return;
      }
      show({ id, content, placement, trigger }, delay);
    },
    [content, id, placement, show],
  );

  useEffect(() => {
    if (activeId !== id) {
      return;
    }
    const trigger = nodeRef.current;
    if (trigger === null) {
      return;
    }
    show({ id, content, placement, trigger }, 0);
  }, [activeId, content, id, placement, show]);

  const describedBy = open ? { "aria-describedby": id } : {};

  return {
    ref,
    onMouseEnter: () => {
      reveal(TOOLTIP_SHOW_DELAY_MS);
    },
    onMouseLeave: () => {
      hide(id, TOOLTIP_HIDE_DELAY_MS);
    },
    onFocus: () => {
      reveal(0);
    },
    onBlur: () => {
      hideNow(id);
    },
    ...describedBy,
  };
}

type TooltipProps = {
  content: string;
  placement: TooltipPlacement;
  children: (bind: TooltipTriggerBind) => ReactElement;
};

export function Tooltip({ content, placement, children }: TooltipProps) {
  const bind = useTooltipTrigger(content, placement);
  return children(bind);
}
