import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type AppRoutePath =
  | "/today"
  | "/explorer"
  | "/opportunities"
  | "/freelance"
  | "/jobs"
  | "/masters"
  | "/remote"
  | "/agents"
  | "/sources"
  | "/crm"
  | "/saved"
  | "/operations"
  | "/profile";

export const VALID_ROUTES: AppRoutePath[] = [
  "/today",
  "/explorer",
  "/opportunities",
  "/freelance",
  "/jobs",
  "/masters",
  "/remote",
  "/agents",
  "/sources",
  "/crm",
  "/saved",
  "/operations",
  "/profile"
];

export function resolveRoutePath(rawPathname: string, rawHash: string): AppRoutePath {
  const hashClean = rawHash.replace(/^#/, "").split("?")[0];
  if (hashClean === "/saved") return "/saved";
  if (VALID_ROUTES.includes(hashClean as AppRoutePath)) {
    return hashClean as AppRoutePath;
  }
  const pathClean = rawPathname.split("?")[0];
  if (pathClean === "/saved") return "/saved";
  if (VALID_ROUTES.includes(pathClean as AppRoutePath)) {
    return pathClean as AppRoutePath;
  }
  return "/today";
}

interface RouterContextValue {
  currentPath: AppRoutePath;
  searchParams: URLSearchParams;
  navigate: (to: AppRoutePath, params?: Record<string, string>) => void;
  setQueryParam: (key: string, value: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export const AppRouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<AppRoutePath>(() =>
    typeof window !== "undefined"
      ? resolveRoutePath(window.location.pathname, window.location.hash)
      : "/today"
  );
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams()
  );

  useEffect(() => {
    const onPopState = (): void => {
      setCurrentPath(resolveRoutePath(window.location.pathname, window.location.hash));
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onPopState);
    };
  }, []);

  const navigate = useCallback((to: AppRoutePath, params?: Record<string, string>) => {
    const sp = new URLSearchParams(params || {});
    const qs = sp.toString();
    const nextUrl = `${to}${qs ? "?" + qs : ""}`;
    if (typeof window !== "undefined") {
      window.history.pushState({ path: to }, "", nextUrl);
    }
    setCurrentPath(to);
    setSearchParams(sp);
  }, []);

  const setQueryParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (!value || value === "ALL") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      const qs = next.toString();
      const nextUrl = `${currentPath}${qs ? "?" + qs : ""}`;
      if (typeof window !== "undefined") {
        window.history.replaceState({ path: currentPath }, "", nextUrl);
      }
      setSearchParams(next);
    },
    [currentPath, searchParams]
  );

  return (
    <RouterContext.Provider value={{ currentPath, searchParams, navigate, setQueryParam }}>
      {children}
    </RouterContext.Provider>
  );
};

export function useAppRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error("useAppRouter must be used inside AppRouterProvider");
  }
  return ctx;
}
