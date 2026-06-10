import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    distDir: isDev
      ? undefined
      : "../../../../AppData/Local/offside-ai-next-sandbox"
  };
};

export default nextConfig;
