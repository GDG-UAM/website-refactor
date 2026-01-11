import type { NextConfig } from "next";
import path from "path";
import { paraglide } from "@inlang/paraglide-next/plugin";
import { withSentryConfig } from "@sentry/nextjs";

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

const config = paraglide({
    paraglide: {
        project: "./project.inlang",
        outdir: "./src/paraglide"
    },
    ...nextConfig
});

export default withSentryConfig(config, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    disableLogger: true,
    automaticVercelMonitors: true
});
