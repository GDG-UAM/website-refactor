import { createHash } from "node:crypto";

// Crawlers, link unfurlers (WhatsApp, Slack, Discord…), scripts and headless browsers.
const BOT_UA =
    /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|slack|embedly|curl|wget|python|axios|node-fetch|headless|lighthouse|monitor/i;

export const isBot = (ua: string | null) => !ua || BOT_UA.test(ua);

/**
 * Counts a view/click at most once per visitor (hashed IP + UA) per item every 24h, ignoring bots.
 * Fire-and-forget: never delays the response. Counts anyway if Redis is unavailable.
 */
export function trackView(headers: Headers, key: string, increment: () => Promise<unknown>) {
    const ua = headers.get("user-agent");
    if (isBot(ua)) return;

    const ip = headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "";
    const visitor = createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 32);

    // Lazy import so tests can use isBot without a Redis connection
    import("./redis")
        .then(({ redis }) => redis.set(`views:${key}:${visitor}`, "1", "EX", 86400, "NX"))
        .catch(() => "OK")
        .then((res) => res === "OK" && increment())
        .catch((err) => console.error(`[views] Failed to count ${key}:`, err));
}
