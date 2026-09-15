import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { NewDiagramDialog } from "../NewDiagramDialog.tsx";
import { ToolButton } from "../common/ToolButton.tsx";
import { useTooltipTrigger } from "../common/Tooltip.tsx";
import {
  documentKindLabel,
  filterLibraryDocuments,
  LAST_DOCUMENT_DELETE_REASON,
  type LibraryDocument,
} from "./library.ts";
import styles from "./DiagramSwitcher.module.css";

export type DiagramSwitcherProps = {
  documents: readonly LibraryDocument[];
  activeDocumentId: string;
  onActivate: (documentId: string) => void;
  onDelete: (documentId: string) => void;
};

const POPUP_GAP_PX = 4;
const POPUP_MARGIN_PX = 8;

export function DiagramSwitcher({
  documents,
  activeDocumentId,
  onActivate,
  onDelete,
}: DiagramSwitcherProps) {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | undefined>(
    undefined,
  );
  const [coords, setCoords] = useState<
    { top: number; left: number; width: number } | undefined
  >(undefined);
  const tooltip = useTooltipTrigger("Cambiar de diagrama.", "bottom");
  const filtered = filterLibraryDocuments(documents, query);
  const active = documents.find((item) => item.id === activeDocumentId);
  const canDelete = documents.length > 1;
  const highlighted = filtered[highlightedIndex];
  const highlightedOptionId =
    highlighted === undefined ? undefined : optionId(listboxId, highlighted.id);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    searchRef.current?.focus();
    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setOpen(false);
      setQuery("");
      triggerRef.current?.focus();
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        triggerRef.current?.contains(target) === true ||
        popupRef.current?.contains(target) === true
      ) {
        return;
      }
      setOpen(false);
      setQuery("");
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    const trigger = triggerRef.current;
    const popup = popupRef.current;
    if (trigger === null || popup === null) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    let top = rect.bottom + POPUP_GAP_PX;
    if (top + popupRect.height > window.innerHeight - POPUP_MARGIN_PX) {
      top = Math.max(
        POPUP_MARGIN_PX,
        rect.top - POPUP_GAP_PX - popupRect.height,
      );
    }
    let left = rect.left;
    if (left + rect.width > window.innerWidth - POPUP_MARGIN_PX) {
      left = Math.max(
        POPUP_MARGIN_PX,
        window.innerWidth - POPUP_MARGIN_PX - rect.width,
      );
    }
    setCoords({ top, left, width: rect.width });
  }, [open, query, filtered.length]);

  useEffect(() => {
    const node = optionRefs.current[highlightedIndex];
    if (node === null || node === undefined) {
      return;
    }
    if (typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  function closeListbox(restoreFocus: boolean) {
    setOpen(false);
    setQuery("");
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }

  function openListbox() {
    const items = filterLibraryDocuments(documents, "");
    const activeIndex = items.findIndex((item) => item.id === activeDocumentId);
    setQuery("");
    setHighlightedIndex(activeIndex === -1 ? 0 : activeIndex);
    setOpen(true);
  }

  function toggleListbox() {
    if (open) {
      closeListbox(true);
      return;
    }
    openListbox();
  }

  function activate(documentId: string) {
    onActivate(documentId);
    closeListbox(true);
  }

  function moveHighlight(delta: number) {
    if (filtered.length === 0) {
      return;
    }
    setHighlightedIndex((current) => {
      const next = current + delta;
      if (next < 0) {
        return filtered.length - 1;
      }
      if (next >= filtered.length) {
        return 0;
      }
      return next;
    });
  }

  function onSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (highlighted !== undefined) {
        activate(highlighted.id);
      }
    }
  }

  function onTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    event.preventDefault();
    if (!open) {
      openListbox();
    }
  }

  function requestDelete(documentId: string) {
    if (!canDelete) {
      return;
    }
    closeListbox(false);
    setPendingDeleteId(documentId);
  }

  function confirmDelete() {
    if (pendingDeleteId === undefined) {
      return;
    }
    onDelete(pendingDeleteId);
    setPendingDeleteId(undefined);
    triggerRef.current?.focus();
  }

  const activeTitle = active?.title ?? "";
  const activeKind = active === undefined ? "" : documentKindLabel(active.kind);

  return (
    <div className={styles.switcher}>
      <button
        ref={(node) => {
          triggerRef.current = node;
          tooltip.ref(node);
        }}
        type="button"
        className={styles.trigger}
        role="combobox"
        aria-label="Diagrama activo"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-activedescendant={open ? highlightedOptionId : undefined}
        {...(tooltip["aria-describedby"] === undefined
          ? {}
          : { "aria-describedby": tooltip["aria-describedby"] })}
        onMouseEnter={tooltip.onMouseEnter}
        onMouseLeave={tooltip.onMouseLeave}
        onFocus={tooltip.onFocus}
        onBlur={tooltip.onBlur}
        onClick={toggleListbox}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={styles.labels}>
          <span className={styles.title}>{activeTitle}</span>
          <span className={styles.kind}>{activeKind}</span>
        </span>
        <span className={styles.caret} aria-hidden="true">
          ▾
        </span>
      </button>
      {open
        ? createPortal(
            <div
              ref={popupRef}
              className={styles.popup}
              style={{
                top: coords?.top ?? 0,
                left: coords?.left ?? 0,
                width: coords?.width ?? undefined,
                visibility: coords === undefined ? "hidden" : "visible",
              }}
              data-testid="diagram-switcher-listbox"
            >
              <input
                ref={searchRef}
                className={styles.search}
                type="search"
                placeholder="Buscar diagrama"
                aria-label="Buscar diagrama"
                autoComplete="off"
                value={query}
                aria-controls={listboxId}
                aria-activedescendant={highlightedOptionId}
                onChange={(event) => {
                  const nextQuery = event.currentTarget.value;
                  setQuery(nextQuery);
                  const next = filterLibraryDocuments(documents, nextQuery);
                  const activeIndex = next.findIndex(
                    (item) => item.id === activeDocumentId,
                  );
                  setHighlightedIndex(activeIndex === -1 ? 0 : activeIndex);
                }}
                onKeyDown={onSearchKeyDown}
              />
              {filtered.length === 0 ? (
                <p className={styles.empty}>Sin coincidencias.</p>
              ) : null}
              <ul
                id={listboxId}
                role="listbox"
                className={styles.list}
                aria-label="Diagramas"
              >
                {filtered.map((item, index) => {
                  const kind = documentKindLabel(item.kind);
                  const selected = item.id === activeDocumentId;
                  return (
                    <li
                      key={item.id}
                      ref={(node) => {
                        optionRefs.current[index] = node;
                      }}
                      id={optionId(listboxId, item.id)}
                      role="option"
                      className={`${styles.option}${index === highlightedIndex ? ` ${styles.highlighted}` : ""}`}
                      aria-selected={selected}
                      onMouseEnter={() => {
                        setHighlightedIndex(index);
                      }}
                      onClick={() => {
                        activate(item.id);
                      }}
                    >
                      <span className={styles.optionBody}>
                        <span className={styles.title}>{item.title}</span>
                        <span className={styles.kind}>{kind}</span>
                      </span>
                      <span
                        className={styles.delete}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        <ToolButton
                          icon="deleteDiagram"
                          label="Eliminar diagrama"
                          description={
                            canDelete
                              ? "Eliminar este diagrama de la biblioteca."
                              : LAST_DOCUMENT_DELETE_REASON
                          }
                          placement="left"
                          unavailable={!canDelete}
                          onClick={() => {
                            requestDelete(item.id);
                          }}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>,
            document.body,
          )
        : null}
      {pendingDeleteId === undefined ? null : (
        <NewDiagramDialog
          title="Eliminar diagrama"
          confirmLabel="Eliminar diagrama"
          description="Se perderá este diagrama. Esta acción no se puede deshacer."
          testId="delete-diagram-dialog"
          onCancel={() => {
            setPendingDeleteId(undefined);
            triggerRef.current?.focus();
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function optionId(listboxId: string, documentId: string): string {
  return `${listboxId}-${documentId}`;
}
