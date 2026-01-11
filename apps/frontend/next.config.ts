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
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "gdg-uam",

    project: "gdguam_refactor_frontend",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    webpack: {
        // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
        // See the following for more information:
        // https://docs.sentry.io/product/crons/
        // https://vercel.com/docs/cron-jobs
        automaticVercelMonitors: false,

        // Tree-shaking options for reducing bundle size
        treeshake: {
            // Automatically tree-shake Sentry logger statements to reduce bundle size
            removeDebugLogging: true
        }
    }
});
