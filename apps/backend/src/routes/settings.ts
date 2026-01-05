import { Elysia, t } from "elysia";
import db from "../lib/db";
import { permissionsPlugin } from "../plugins/permissions";
import { User } from "../repositories";

// Helper function to transform flat user to nested settings structure
function userToSettingsDTO(user: User) {
    return {
        general: {
            timeFormat: (user.timeFormat || "24h") as "24h" | "12h",
            firstDayOfWeek: (user.firstDayOfWeek || "monday") as "monday" | "sunday"
        },
        profile: {
            displayName: user.displayName,
            shortBio: user.shortBio,
            github: user.github,
            linkedin: user.linkedin,
            x: user.x,
            instagram: user.instagram,
            website: user.website,
            customTags: user.customTags
        },
        privacy: {
            showAttendance: user.showAttendance ?? false,
            showResults: user.showResults ?? false,
            allowTagInstagram: user.allowTagInstagram ?? true,
            allowTagLinkedIn: user.allowTagLinkedIn ?? true,
            allowMentionBlog: user.allowMentionBlog ?? true,
            showProfilePublicly: user.showProfilePublicly ?? true,
            photoConsent: user.photoConsent ?? true,
            allowAnonUsage: user.allowAnonUsage ?? true
        },
        events: {
            dietary: user.dietary,
            tshirtSize: user.tshirtSize as "XS" | "S" | "M" | "L" | "XL" | "XXL" | undefined
        },
        games: {
            scoreboardNickname: user.scoreboardNickname,
            anonymousOnScoreboard: user.anonymousOnScoreboard ?? false,
            showRankings: user.showRankings ?? true
        },
        notifications: {
            emailMentions: user.emailMentions ?? true,
            weeklyNewsletter: user.weeklyNewsletter ?? false,
            urgentAlerts: user.urgentAlerts ?? true
        },
        accessibility: {
            highContrast: user.highContrast ?? false,
            reducedMotion: user.reducedMotion ?? false,
            dyslexicFont: user.dyslexicFont ?? false,
            daltonismMode: (user.daltonismMode || "none") as "none" | "deuteranopia" | "protanopia" | "tritanopia"
        }
    };
}

export const settingsRoutes = new Elysia({ prefix: "/settings" })
    .use(permissionsPlugin)
    // GET /settings - Get all user settings
    .get("/", async ({ user, set }) => {
        if (!user) {
            set.status = 401;
            return { error: "Not logged in" };
        }

        const { userRepository } = db.getRepositories();
        const userDoc = await userRepository.findById(user.id);

        if (!userDoc) {
            set.status = 404;
            return { error: "User not found" };
        }

        return userToSettingsDTO(userDoc);
    })

    // PATCH /settings/:category - Update a specific category
    .patch(
        "/:category",
        async ({ user, set, params, body }) => {
            if (!user) {
                set.status = 401;
                return { error: "Not logged in" };
            }

            const { category } = params;
            // const validCategories = ["general", "profile", "privacy", "events", "games", "notifications", "accessibility"];
            const validCategories = ["general", "profile", "privacy", "events", "notifications", "accessibility"];

            if (!validCategories.includes(category)) {
                set.status = 400;
                return { error: "Invalid category" };
            }

            // Map nested category data to flat user fields
            const updateFields: Record<string, unknown> = {};

            switch (category) {
                case "general":
                    if (body.timeFormat) updateFields.timeFormat = body.timeFormat;
                    if (body.firstDayOfWeek) updateFields.firstDayOfWeek = body.firstDayOfWeek;
                    break;

                case "profile":
                    if (body.displayName !== undefined) updateFields.displayName = body.displayName;
                    if (body.shortBio !== undefined) updateFields.shortBio = body.shortBio;
                    if (body.github !== undefined) updateFields.github = body.github;
                    if (body.linkedin !== undefined) updateFields.linkedin = body.linkedin;
                    if (body.x !== undefined) updateFields.x = body.x;
                    if (body.instagram !== undefined) updateFields.instagram = body.instagram;
                    if (body.website !== undefined) updateFields.website = body.website;
                    if (body.customTags !== undefined) updateFields.customTags = body.customTags;
                    break;

                case "privacy":
                    if (body.showAttendance !== undefined) updateFields.showAttendance = body.showAttendance;
                    if (body.showResults !== undefined) updateFields.showResults = body.showResults;
                    if (body.allowTagInstagram !== undefined) updateFields.allowTagInstagram = body.allowTagInstagram;
                    if (body.allowTagLinkedIn !== undefined) updateFields.allowTagLinkedIn = body.allowTagLinkedIn;
                    if (body.allowMentionBlog !== undefined) updateFields.allowMentionBlog = body.allowMentionBlog;
                    if (body.showProfilePublicly !== undefined) updateFields.showProfilePublicly = body.showProfilePublicly;
                    if (body.photoConsent !== undefined) updateFields.photoConsent = body.photoConsent;
                    if (body.allowAnonUsage !== undefined) updateFields.allowAnonUsage = body.allowAnonUsage;
                    break;

                case "events":
                    if (body.dietary !== undefined) updateFields.dietary = body.dietary;
                    if (body.tshirtSize !== undefined) updateFields.tshirtSize = body.tshirtSize;
                    break;

                // case "games":
                //     if (body.scoreboardNickname !== undefined) updateFields.scoreboardNickname = body.scoreboardNickname;
                //     if (body.anonymousOnScoreboard !== undefined) updateFields.anonymousOnScoreboard = body.anonymousOnScoreboard;
                //     if (body.showRankings !== undefined) updateFields.showRankings = body.showRankings;
                //     break;

                case "notifications":
                    if (body.emailMentions !== undefined) updateFields.emailMentions = body.emailMentions;
                    if (body.weeklyNewsletter !== undefined) updateFields.weeklyNewsletter = body.weeklyNewsletter;
                    // Always enforce urgentAlerts as true
                    if (body.urgentAlerts !== undefined) updateFields.urgentAlerts = true;
                    break;

                case "accessibility":
                    if (body.highContrast !== undefined) updateFields.highContrast = body.highContrast;
                    if (body.reducedMotion !== undefined) updateFields.reducedMotion = body.reducedMotion;
                    if (body.dyslexicFont !== undefined) updateFields.dyslexicFont = body.dyslexicFont;
                    if (body.daltonismMode !== undefined) updateFields.daltonismMode = body.daltonismMode;
                    break;
            }

            // Update the user document
            const { userRepository } = db.getRepositories();
            const result = await userRepository.updateSettings(user.id, updateFields);

            if (!result) {
                set.status = 404;
                return { error: "User not found" };
            }

            return userToSettingsDTO(result);
        },
        {
            body: t.Record(t.String(), t.Unknown()),
            params: t.Object({
                category: t.String()
            })
        }
    );
