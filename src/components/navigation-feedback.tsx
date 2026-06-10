"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a[href]");

      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank" ||
        link.origin !== window.location.origin ||
        link.href === window.location.href
      ) {
        return;
      }

      setIsNavigating(true);
    }

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  if (!isNavigating) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-1 overflow-hidden bg-forest-100">
      <div className="h-full w-1/2 animate-[navigation-feedback_0.9s_ease-in-out_infinite] rounded-r-full bg-forest-700" />
      <style>{`
        @keyframes navigation-feedback {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>
    </div>
  );
}
