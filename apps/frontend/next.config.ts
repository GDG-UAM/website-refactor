import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Tells Next.js to trace files starting from the monorepo root
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
