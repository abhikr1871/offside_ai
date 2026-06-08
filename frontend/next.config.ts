import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build output goes to AppData/Local which is NOT synced by OneDrive.
  // This prevents EPERM file-lock errors caused by OneDrive locking .next/trace.
  distDir: "../../../../AppData/Local/offside-ai-next"
};

export default nextConfig;
