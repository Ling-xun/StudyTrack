"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type TransitionPage = {
  children: ReactNode;
  key: string;
  phase: "enter" | "exit";
};

const transitionDuration = 260;

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentPage = useRef({ children, key: pathname });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [transitionPages, setTransitionPages] = useState<TransitionPage[] | null>(null);

  useEffect(() => {
    const previousPage = currentPage.current;

    if (previousPage.key === pathname) {
      return;
    }

    if (timer.current) {
      clearTimeout(timer.current);
    }

    const nextPage = { children, key: pathname };
    currentPage.current = nextPage;
    setTransitionPages([
      { ...previousPage, phase: "exit" },
      { ...nextPage, phase: "enter" },
    ]);

    timer.current = setTimeout(() => {
      setTransitionPages(null);
      timer.current = null;
    }, transitionDuration);
  }, [children, pathname]);

  useEffect(() => {
    if (!transitionPages && currentPage.current.key === pathname) {
      currentPage.current = { children, key: pathname };
    }
  }, [children, pathname, transitionPages]);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  if (transitionPages) {
    return (
      <div className="page-transition-stage" aria-live="polite">
        {transitionPages.map((page) => (
          <div key={`${page.key}-${page.phase}`} className={`page-transition-view page-transition-${page.phase}`}>
            {page.children}
          </div>
        ))}
      </div>
    );
  }

  return <div className="page-transition-view page-transition-enter">{children}</div>;
}
