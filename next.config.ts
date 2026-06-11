import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress hydration warnings caused by browser extensions (Grammarly, LastPass, etc.)
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
