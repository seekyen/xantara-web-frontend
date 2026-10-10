import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Dev server is accessed at 127.0.0.1:3000, which Next.js doesn't trust by default —
  // without this, the HMR websocket is blocked and edits silently fall back to stale
  // cached bundles until a manual reload.
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;
