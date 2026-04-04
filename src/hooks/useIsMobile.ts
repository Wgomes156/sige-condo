import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => window.innerWidth <= MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState<boolean>(
    () =>
      window.innerWidth > MOBILE_BREAKPOINT &&
      window.innerWidth <= TABLET_BREAKPOINT
  );

  useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT + 1}px) and (max-width: ${TABLET_BREAKPOINT}px)`
    );
    const handler = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mql.addEventListener("change", handler);
    setIsTablet(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isTablet;
}

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(
    () => window.innerWidth > TABLET_BREAKPOINT
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT + 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    setIsDesktop(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}
