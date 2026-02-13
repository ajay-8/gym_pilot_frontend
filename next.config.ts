import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress hydration warnings caused by browser extensions (Grammarly, LastPass, etc.)
  reactStrictMode: true,

  // Optional: Add this if you still see warnings in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
