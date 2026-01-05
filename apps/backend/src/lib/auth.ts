import { betterAuth } from "better-auth/minimal";
import { organization } from "better-auth/plugins";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "./db";

export const auth = betterAuth({
    database: mongodbAdapter(client.db()),
    baseURL: process.env.FRONTEND_URL || "http://localhost:3000",
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
        }
    },
    plugins: [
        organization({
            allowUserToCreateOrganization: false,
            allowUserToChangeRole: false
        })
    ],
    trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3001", process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"],
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60
        }
    }
});
