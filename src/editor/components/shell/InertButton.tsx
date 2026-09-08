import type { KeyboardEvent, MouseEvent } from "react";

type InertButtonProps = {
  children: string;
  reason: string;
};

export function InertButton({ children, reason }: InertButtonProps) {
  function preventActivation(
    event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
  ) {
    if ("key" in event && event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
  }

  return (
    <button
      type="button"
      aria-disabled="true"
      title={reason}
      onClick={preventActivation}
      onKeyDown={preventActivation}
    >
      {children}
    </button>
  );
}
