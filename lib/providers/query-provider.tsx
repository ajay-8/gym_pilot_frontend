"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: data is fresh for 30 seconds
            staleTime: 30 * 1000,
            // Retry failed requests 1 time
            retry: 1,
            // Refetch on window focus in production only
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
          },
          mutations: {
            // Retry failed mutations 0 times
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show devtools in development */}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
