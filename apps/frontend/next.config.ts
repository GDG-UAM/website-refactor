import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  env: {
    INTERNAL_BACKEND_URL: process.env.INTERNAL_BACKEND_URL,
  },
};

export default nextConfig;
