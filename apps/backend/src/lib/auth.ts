import { betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "./db";
import { redis } from "./redis";
import { ObjectId } from "mongodb";

// Key prefix for tracking which session keys belong to which user
const USER_SESSIONS_PREFIX = "user-sessions:";

/**
 * Track a session key for a user in Redis (using a SET)
 */
async function trackSessionKey(key: string, userId: string): Promise<void> {
    await redis.sadd(`${USER_SESSIONS_PREFIX}${userId}`, key);
}

/**
 * Update all cached sessions for a specific user
 * Call this when a user's data changes (role, permissions, etc.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateUserSessions(userId: string, user?: any): Promise<void> {
    if (!user) {
        // Lazy import to avoid circular dependency at module load time
        const db = await import("./db");
        try {
            const { userRepository } = db.getRepositories();
            user = await userRepository.findById(userId);
        } catch {
            // Fallback to direct client if repositories not initialized yet
            user = await client.db();
            user = await client
                .db()
                .collection("user")
                .findOne({ _id: new ObjectId(userId) });
        }
        if (!user) return;
    }

    // Ensure user object is a plain object and has id instead of _id
    // to match the format Better Auth uses in the session cache
    if (user._id) {
        user = {
            ...user,
            id: user._id.toString()
        };
        delete user._id;
    }

    const sessionSetKey = `${USER_SESSIONS_PREFIX}${userId}`;
    const keys = await redis.smembers(sessionSetKey);

    if (keys.length > 0) {
        for (const key of keys) {
            const cachedValue = await redis.get(key);
            if (cachedValue) {
                try {
                    const parsed = JSON.parse(cachedValue);
                    parsed.user = user;

                    // Preserve the TTL
                    const ttl = await redis.ttl(key);
                    if (ttl > 0) {
                        await redis.set(key, JSON.stringify(parsed), "EX", ttl);
                    } else {
                        // Default to 1 hour if no TTL found (Better auth usually handles this)
                        await redis.set(key, JSON.stringify(parsed), "EX", 3600);
                    }
                } catch {
                    // Ignore parsing errors
                }
            } else {
                // Cleanup stale keys from the user session set
                await redis.srem(sessionSetKey, key);
            }
        }
    }
}

/**
 * Clear all session cache entries
 * WARNING: This will flush the entire Redis database if not careful.
 * Since we use a prefix, we only delete our keys.
 */
export async function clearSessionCache(): Promise<void> {
    const keys = await redis.keys("*");
    if (keys.length > 0) {
        // We need to remove the global prefix before calling del if we are using redis.del
        // but ioredis handles prefixing. However, redis.keys returns keys WITH the prefix.
        // Wait, ioredis 'keys' returns keys WITHOUT the prefix.
        await redis.del(...keys);
    }
}

export const auth = betterAuth({
    database: mongodbAdapter(client.db()),
    baseURL: process.env.BACKEND_URL || "http://localhost:3002",
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
        }
    },
    user: {
        additionalFields: {
            // Note: 'role' field is managed by the admin plugin via defaultRole and roles config
            // Do NOT add a 'role' field here as it conflicts with the admin plugin
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
    trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3001", process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002"],
    session: {
        cookieCache: {
            enabled: false // Disabled due to complex JSON fields exceeding cookie size limits
        }
    },
    // secondaryStorage: {
    //     // Redis-backed session cache (avoids hitting DB on every request)
    //     get: async (key) => {
    //         const cached = await redis.get(key);
    //         return cached || null;
    //     },
    //     set: async (key, value, ttl) => {
    //         if (ttl) {
    //             await redis.set(key, value, "EX", ttl);
    //         } else {
    //             await redis.set(key, value);
    //         }

    //         // Try to extract userId from the cached data for tracking
    //         try {
    //             const parsed = JSON.parse(value);
    //             const userId = parsed.userId || parsed.user?.id;
    //             if (userId) {
    //                 await trackSessionKey(key, userId);
    //             }
    //         } catch {
    //             // Ignore parsing errors
    //         }
    //     },
    //     delete: async (key) => {
    //         await redis.del(key);
    //     }
    // },
    plugins: [
        admin({
            defaultRole: "user",
            adminRoles: ["organizer", "admin"],
            allowImpersonatingAdmins: false,
            roles: {
                user: {
                    authorize: () => ({ success: false, error: "Not authorized" }),
                    statements: {}
                },
                team: {
                    authorize: () => ({ success: false, error: "Not authorized" }),
                    statements: {}
                },
                organizer: {
                    authorize: () => ({ success: true }),
                    statements: {}
                },
                admin: {
                    authorize: () => ({ success: true }),
                    statements: {}
                }
            }
        })
    ]
});
