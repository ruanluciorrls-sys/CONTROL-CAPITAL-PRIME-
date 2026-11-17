import { Fragment, useLayoutEffect, useRef } from "react";
import type { ReactElement, RefObject } from "react";

interface PageFadeProps {
  target: RefObject<HTMLElement | null>;
  tab: string;
  refreshKey: number;
  children: ReactElement;
}

export default function PageFade({ target, tab, refreshKey, children }: PageFadeProps) {
  const page = children.type;
  const previousPage = useRef<{ tab: string; page: ReactElement["type"] } | null>(null);

  // Dentro do Suspense, o efeito roda quando a tela, e nao o fallback, aparece.
  useLayoutEffect(() => {
    const previous = previousPage.current;
    previousPage.current = { tab, page };
    if (!previous || previous.tab === tab || previous.page === page) return;

    const element = target.current;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!element?.animate || reducedMotion?.matches) return;

    const animation = element.animate(
      [{ opacity: 0.75 }, { opacity: 1 }],
      { duration: 180, easing: "ease-out" },
    );
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) animation.cancel();
    };

    reducedMotion?.addEventListener?.("change", onMotionChange);
    return () => {
      reducedMotion?.removeEventListener?.("change", onMotionChange);
      animation.cancel();
    };
  }, [page, tab, target]);

  return <Fragment key={refreshKey}>{children}</Fragment>;
}
