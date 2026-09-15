import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./CanvasContextMenu.module.css";

export type CanvasContextMenuProps = {
  x: number;
  y: number;
  canCopy: boolean;
  canPaste: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onClose: () => void;
};

export function CanvasContextMenu({
  x,
  y,
  canCopy,
  canPaste,
  onCopy,
  onPaste,
  onClose,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (menu === null) {
      return;
    }
    const rect = menu.getBoundingClientRect();
    const margin = 8;
    setPosition({
      left: Math.max(
        margin,
        Math.min(x, window.innerWidth - rect.width - margin),
      ),
      top: Math.max(
        margin,
        Math.min(y, window.innerHeight - rect.height - margin),
      ),
    });
  }, [x, y]);

  useEffect(() => {
    const menu = menuRef.current;
    const firstEnabled = menu?.querySelector<HTMLButtonElement>(
      'button:not([aria-disabled="true"])',
    );
    firstEnabled?.focus();
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        menuRef.current !== null &&
        menuRef.current.contains(target)
      ) {
        return;
      }
      onClose();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className={styles.menu}
      role="menu"
      aria-label="Copiar y pegar"
      data-testid="canvas-context-menu"
      style={{ left: position.left, top: position.top }}
    >
      <button
        type="button"
        className={styles.item}
        role="menuitem"
        aria-disabled={canCopy ? undefined : "true"}
        onClick={() => {
          if (!canCopy) {
            return;
          }
          onCopy();
          onClose();
        }}
      >
        Copiar
      </button>
      <button
        type="button"
        className={styles.item}
        role="menuitem"
        aria-disabled={canPaste ? undefined : "true"}
        onClick={() => {
          if (!canPaste) {
            return;
          }
          onPaste();
          onClose();
        }}
      >
        Pegar
      </button>
    </div>,
    document.body,
  );
}
