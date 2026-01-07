import { Elysia, t } from "elysia";
import { sendContactEmail, ContactPayload } from "../lib/mail/brevo";

export const contactRoutes = new Elysia({ prefix: "/contact" }).post(
    "/",
    async ({ body, set }) => {
        try {
            const { type, name, email, message, orgName, website } = body;

            const payload = {
                type: type === "sponsor" ? "sponsor" : "personal",
                name,
                email,
                message,
                orgName,
                website
            } as ContactPayload;

            await sendContactEmail(payload);
            set.status = 200;
            return { ok: true };
        } catch (err) {
            console.error("Error in contact route:", err);
            set.status = 400;
            return { error: "Error processing contact request" };
        }
    },
    {
        body: t.Object({
            type: t.Union([t.Literal("sponsor"), t.Literal("personal")]),
            name: t.String(),
            email: t.String(),
            message: t.String(),
            orgName: t.Optional(t.String()),
            website: t.Optional(t.String())
        }),
        response: {
            200: t.Object({ ok: t.Boolean() }),
            400: t.Object({ error: t.String() })
        }
    }
);
