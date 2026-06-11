"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createContext, useCallback, useContext, useState } from "react";

// ── DevTools context ───────────────────────────────────────────────────────────
const DevToolsContext = createContext<{
  devToolsActive: boolean;
  toggleDevTools: () => void;
}>({
  devToolsActive: false,
  toggleDevTools: () => {},
});

export function useDevTools() {
  return useContext(DevToolsContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  const [devToolsActive, setDevToolsActive] = useState(false);
  // Incrementing key forces a fresh mount (reopens panel) each time user toggles on
  const [mountKey, setMountKey] = useState(0);

  const toggleDevTools = useCallback(() => {
    setDevToolsActive((prev) => {
      if (!prev) setMountKey((k) => k + 1); // fresh mount on open
      return !prev;
    });
  }, []);

  return (
    <DevToolsContext.Provider value={{ devToolsActive, toggleDevTools }}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === "development" && devToolsActive && (
          <ReactQueryDevtools key={mountKey} initialIsOpen={true} />
        )}
      </QueryClientProvider>
    </DevToolsContext.Provider>
  );
}
