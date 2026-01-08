import { betterAuth } from "better-auth/minimal";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "./db";

export const auth = betterAuth({
    database: mongodbAdapter(client.db()),
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000",
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
        }
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
                input: false
            },
            individualPermissions: {
                type: "json",
                required: false,
                input: false
            },
            templatesUsed: {
                type: "string[]",
                required: false,
                input: false
            },
            templatePermissions: {
                type: "json",
                required: false,
                input: false
            },
            // General Settings
            timeFormat: {
                type: "string",
                required: false,
                defaultValue: "24h",
                input: false
            },
            firstDayOfWeek: {
                type: "string",
                required: false,
                defaultValue: "monday",
                input: false
            },
            // Profile
            displayName: {
                type: "string",
                required: false,
                input: false
            },
            shortBio: {
                type: "string",
                required: false,
                input: false
            },
            github: {
                type: "string",
                required: false,
                input: false
            },
            linkedin: {
                type: "string",
                required: false,
                input: false
            },
            x: {
                type: "string",
                required: false,
                input: false
            },
            instagram: {
                type: "string",
                required: false,
                input: false
            },
            website: {
                type: "string",
                required: false,
                input: false
            },
            customTags: {
                type: "string[]",
                required: false,
                input: false
            },
            // Privacy
            showAttendance: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false
            },
            showResults: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false
            },
            allowTagInstagram: {
                type: "boolean",
                required: false,
                defaultValue: true,
                input: false
            },
            allowTagLinkedIn: {
                type: "boolean",
                required: false,
                defaultValue: true,
                input: false
            },
            allowMentionBlog: {
                type: "boolean",
                required: false,
                defaultValue: true,
                input: false
            },
            showProfilePublicly: {
                type: "boolean",
                required: false,
                defaultValue: true,
                input: false
            },
            photoConsent: {
                type: "boolean",
                required: false,
                defaultValue: true,
                input: false
            },
            // allowAnonUsage: {
            //     type: "boolean",
            //     required: false,
            //     defaultValue: true,
            //     input: false
            // },
            // Events
            dietary: {
                type: "string",
                required: false,
                input: false
            },
            tshirtSize: {
                type: "string",
                required: false,
                defaultValue: "M",
                input: false
            },
            // Games
            // scoreboardNickname: {
            //     type: "string",
            //     required: false,
            //     input: false
            // },
            // anonymousOnScoreboard: {
            //     type: "boolean",
            //     required: false,
            //     defaultValue: false,
            //     input: false
            // },
            // showRankings: {
            //     type: "boolean",
            //     required: false,
            //     defaultValue: true,
            //     input: false
            // },
            // Notifications
            emailMentions: {
                type: "boolean",
                required: false,
                defaultValue: true,
                input: false
            },
            weeklyNewsletter: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false
            },
            urgentAlerts: {
                type: "boolean",
                required: false,
                defaultValue: true,
                input: false
            },
            // Accessibility
            highContrast: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false
            },
            reducedMotion: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false
            },
            dyslexicFont: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false
            },
            daltonismMode: {
                type: "string",
                required: false,
                defaultValue: "none",
                input: false
            }
        }
    },
    trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3001", process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"],
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 3 * 60
        }
    }
});
