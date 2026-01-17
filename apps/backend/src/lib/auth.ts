import { betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "./db";
import { LRUCache } from "lru-cache";
import { ObjectId } from "mongodb";

// Track which cache keys belong to which user (for invalidation)
const userSessionKeys = new Map<string, Set<string>>();
// Reverse mapping: key -> userId (for cleanup when cache entries expire)
const keyToUser = new Map<string, string>();

// In-memory session cache to avoid DB queries on every request
// Max 1000 sessions, 3 minute TTL by default
const sessionCache = new LRUCache<string, string>({
    max: 1000,
    ttl: 3 * 60 * 1000, // 3 minutes in milliseconds
    dispose: (_value, key) => {
        // Clean up tracking maps when a session key expires or is evicted
        const userId = keyToUser.get(key);
        if (userId) {
            const keys = userSessionKeys.get(userId);
            if (keys) {
                keys.delete(key);
                if (keys.size === 0) {
                    userSessionKeys.delete(userId);
                }
            }
            keyToUser.delete(key);
        }
    }
});

/**
 * Track a session key for a user (called when caching session data)
 */
function trackSessionKey(key: string, userId: string): void {
    // Add to user -> keys mapping
    let keys = userSessionKeys.get(userId);
    if (!keys) {
        keys = new Set();
        userSessionKeys.set(userId, keys);
    }
    keys.add(key);
    // Add reverse mapping
    keyToUser.set(key, userId);
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

    const keys = userSessionKeys.get(userId);
    if (keys) {
        // Copy keys to array since we'll be modifying the tracking during iteration
        const keyArray = Array.from(keys);
        for (const key of keyArray) {
            const cachedValue = sessionCache.get(key);
            if (cachedValue) {
                try {
                    const parsed = JSON.parse(cachedValue);
                    parsed.user = user;

                    // Preserve the TTL if possible
                    const remaining = sessionCache.getRemainingTTL(key);
                    sessionCache.set(key, JSON.stringify(parsed), {
                        ttl: remaining > 0 ? remaining : 3 * 60 * 1000
                    });

                    trackSessionKey(key, userId);
                } catch {
                    // Ignore parsing errors
                }
            }
        }
    }
}

/**
 * Clear all session cache entries
 */
export function clearSessionCache(): void {
    sessionCache.clear();
    userSessionKeys.clear();
    keyToUser.clear();
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
    secondaryStorage: {
        // In-memory LRU cache for session data (avoids hitting DB on every request)
        get: async (key) => {
            const cached = sessionCache.get(key);
            return cached || null;
        },
        set: async (key, value, ttl) => {
            sessionCache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
            // Try to extract userId from the cached data for tracking
            try {
                const parsed = JSON.parse(value);
                const userId = parsed.userId || parsed.user?.id;
                if (userId) {
                    trackSessionKey(key, userId);
                }
            } catch {
                // Ignore parsing errors
            }
        },
        delete: async (key) => {
            sessionCache.delete(key);
        }
    },
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
