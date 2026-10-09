import { useEffect, type RefObject } from "react";

/** Calls `onOutside` when a click or Escape happens outside `ref` while `active`. */
export function useClickOutside(ref: RefObject<HTMLElement>, active: boolean, onOutside: () => void) {
  useEffect(() => {
    if (!active) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOutside();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, active, onOutside]);
}
