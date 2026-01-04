import type { NextConfig } from "next";
import path from "path";
import { paraglide } from "@inlang/paraglide-next/plugin";

const nextConfig: NextConfig = {
    output: "standalone",
    compiler: {
        styledComponents: true
    },
    images: {
        // Allow images from any remote source
        // Security is handled by sanitizing markdown content
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**"
            },
            {
                protocol: "http",
                hostname: "**"
            }
        ]
    },
    outputFileTracingRoot: path.join(__dirname, "../../")
};

export default paraglide({
    paraglide: {
        project: "./.inlang",
        outdir: "./src/paraglide"
    },
    ...nextConfig
});
