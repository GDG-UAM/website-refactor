import { auth } from "./auth";
import { client } from "./db";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * DEV ONLY: when DEV_SESSION_EMAIL is set (and NODE_ENV is exactly "development"), every request is signed in as that
 * user, without Better Auth. For working where Google sign-in is unreachable (VPNs). Never active in production.
 */
export const devSessionEmail = process.env.NODE_ENV === "development" ? process.env.DEV_SESSION_EMAIL || null : null;

if (devSessionEmail) {
    console.warn(`[auth] DEV_SESSION_EMAIL is set: every request is signed in as ${devSessionEmail}`);
}

/** Better Auth's getSession, replaced by the dev session when DEV_SESSION_EMAIL is active. */
export async function getSession(headers: Headers): Promise<Session> {
    if (!devSessionEmail) return auth.api.getSession({ headers });

    const doc = await client.db().collection("user").findOne({ email: devSessionEmail });
    if (!doc) throw new Error(`DEV_SESSION_EMAIL: no user with the email ${devSessionEmail}`);

    // Same shape as Better Auth's session cache (see updateUserSessions): the user document with id instead of _id
    const { _id, ...user } = doc;
    const now = new Date();
    return {
        user: { ...user, id: _id.toString() },
        session: {
            id: "dev-session",
            token: "dev-session",
            userId: _id.toString(),
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now,
            ipAddress: null,
            userAgent: null
        }
    } as unknown as Session;
}
