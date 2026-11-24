import { expect, test } from "bun:test";
import { isBot } from "./views";

test("isBot", () => {
    for (const ua of [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0"
    ])
        expect(isBot(ua)).toBe(false);

    for (const ua of [
        null,
        "",
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "WhatsApp/2.23.20.0",
        "facebookexternalhit/1.1",
        "Slackbot-LinkExpanding 1.0",
        "curl/8.4.0"
    ])
        expect(isBot(ua)).toBe(true);
});
