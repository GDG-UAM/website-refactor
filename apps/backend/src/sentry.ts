import * as Sentry from "@sentry/bun";

export const initSentry = () => {
    if (!process.env.SENTRY_DSN) {
        console.warn("SENTRY_DSN not found. Sentry is disabled.");
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1.0,
        environment: process.env.NODE_ENV || "development"
    });

    console.log("Sentry initialized for Backend");
};

export { Sentry };
