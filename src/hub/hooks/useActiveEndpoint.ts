import { useEffect, useState } from "react";

export function useActiveEndpoint(endpointIds: string[], suppressed: boolean) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (!mainEl || endpointIds.length === 0) {
      setActiveId(null);
      return;
    }

    const root = mainEl;

    function onScroll() {
      if (suppressed) return;

      const mainRect = root.getBoundingClientRect();
      const threshold = mainRect.top + 60;

      let currentId: string | null = null;

      for (const id of endpointIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;

        if (top <= threshold) {
          currentId = id;
        } else {
          break;
        }
      }

      setActiveId(currentId);
    }

    mainEl.addEventListener("scroll", onScroll);
    onScroll();

    return () => mainEl.removeEventListener("scroll", onScroll);
  }, [endpointIds, suppressed]);

  return activeId;
}
