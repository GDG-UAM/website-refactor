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
            displayName: user.displayName ?? undefined,
            shortBio: user.shortBio ?? undefined,
            github: user.github ?? undefined,
            linkedin: user.linkedin ?? undefined,
            x: user.x ?? undefined,
            instagram: user.instagram ?? undefined,
            website: user.website ?? undefined,
            customTags: user.customTags ?? undefined
        },
        privacy: {
            showAttendance: user.showAttendance ?? false,
            showResults: user.showResults ?? false,
            allowTagInstagram: user.allowTagInstagram ?? true,
            allowTagLinkedIn: user.allowTagLinkedIn ?? true,
            allowMentionBlog: user.allowMentionBlog ?? true,
            showProfilePublicly: user.showProfilePublicly ?? true,
            photoConsent: user.photoConsent ?? true
            // allowAnonUsage: user.allowAnonUsage ?? true
        },
        events: {
            dietary: user.dietary ?? undefined,
            tshirtSize: user.tshirtSize as "XS" | "S" | "M" | "L" | "XL" | "XXL" | undefined
        },
        // games: {
        //     scoreboardNickname: user.scoreboardNickname ?? undefined,
        //     anonymousOnScoreboard: user.anonymousOnScoreboard ?? false,
        //     showRankings: user.showRankings ?? true
        // },
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

const UserSettingsSchema = t.Object({
    general: t.Object({
        timeFormat: t.Union([t.Literal("24h"), t.Literal("12h")], {
            default: "24h"
        }),
        firstDayOfWeek: t.Union([t.Literal("monday"), t.Literal("sunday")], {
            default: "monday"
        })
    }),

    profile: t.Object({
        displayName: t.Optional(t.String()),
        shortBio: t.Optional(t.String()),
        github: t.Optional(t.String()),
        linkedin: t.Optional(t.String()),
        x: t.Optional(t.String()),
        instagram: t.Optional(t.String()),
        website: t.Optional(t.String()),
        customTags: t.Optional(t.Array(t.String()))
    }),

    privacy: t.Object({
        showAttendance: t.Boolean({ default: false }),
        showResults: t.Boolean({ default: false }),
        allowTagInstagram: t.Boolean({ default: true }),
        allowTagLinkedIn: t.Boolean({ default: true }),
        allowMentionBlog: t.Boolean({ default: true }),
        showProfilePublicly: t.Boolean({ default: true }),
        photoConsent: t.Boolean({ default: true })
        // allowAnonUsage: t.Boolean({ default: true })
    }),

    events: t.Object({
        dietary: t.Optional(t.String()),
        tshirtSize: t.Optional(t.Union([t.Literal("XS"), t.Literal("S"), t.Literal("M"), t.Literal("L"), t.Literal("XL"), t.Literal("XXL")]))
    }),

    // games: t.Object({
    //     scoreboardNickname: t.Optional(t.String()),
    //     anonymousOnScoreboard: t.Boolean({ default: false }),
    //     showRankings: t.Boolean({ default: true })
    // }),

    notifications: t.Object({
        emailMentions: t.Boolean({ default: true }),
        weeklyNewsletter: t.Boolean({ default: false }),
        urgentAlerts: t.Boolean({ default: true })
    }),

    accessibility: t.Object({
        highContrast: t.Boolean({ default: false }),
        reducedMotion: t.Boolean({ default: false }),
        dyslexicFont: t.Boolean({ default: false }),
        daltonismMode: t.Union([t.Literal("none"), t.Literal("deuteranopia"), t.Literal("protanopia"), t.Literal("tritanopia")], { default: "none" })
    })
});

const UserSettingsFlatSchema = t.Object({
    timeFormat: t.Optional(t.Union([t.Literal("24h"), t.Literal("12h")])),
    firstDayOfWeek: t.Optional(t.Union([t.Literal("monday"), t.Literal("sunday")])),

    displayName: t.Optional(t.String()),
    shortBio: t.Optional(t.String()),
    github: t.Optional(t.String()),
    linkedin: t.Optional(t.String()),
    x: t.Optional(t.String()),
    instagram: t.Optional(t.String()),
    website: t.Optional(t.String()),
    customTags: t.Optional(t.Array(t.String())),

    showAttendance: t.Optional(t.Boolean()),
    showResults: t.Optional(t.Boolean()),
    allowTagInstagram: t.Optional(t.Boolean()),
    allowTagLinkedIn: t.Optional(t.Boolean()),
    allowMentionBlog: t.Optional(t.Boolean()),
    showProfilePublicly: t.Optional(t.Boolean()),
    photoConsent: t.Optional(t.Boolean()),
    allowAnonUsage: t.Optional(t.Boolean()),

    dietary: t.Optional(t.String()),
    tshirtSize: t.Optional(t.Union([t.Literal("XS"), t.Literal("S"), t.Literal("M"), t.Literal("L"), t.Literal("XL"), t.Literal("XXL")])),

    // scoreboardNickname: t.Optional(t.String()),
    // anonymousOnScoreboard: t.Optional(t.Boolean()),
    // showRankings: t.Optional(t.Boolean()),

    emailMentions: t.Optional(t.Boolean()),
    weeklyNewsletter: t.Optional(t.Boolean()),
    urgentAlerts: t.Optional(t.Boolean()),

    highContrast: t.Optional(t.Boolean()),
    reducedMotion: t.Optional(t.Boolean()),
    dyslexicFont: t.Optional(t.Boolean()),
    daltonismMode: t.Optional(t.Union([t.Literal("none"), t.Literal("deuteranopia"), t.Literal("protanopia"), t.Literal("tritanopia")]))
});

export const settingsRoutes = new Elysia({ prefix: "/settings" })
    .use(permissionsPlugin)
    // GET /settings - Get all user settings
    .get(
        "/",
        async ({ user, set }) => {
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
        },
        {
            response: {
                200: UserSettingsSchema,
                401: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Settings"]
            }
        }
    )

    // PATCH /settings/:category - Update a specific category
    .patch(
        "/",
        async ({ user, set, body }) => {
            if (!user) {
                set.status = 401;
                return { error: "Not logged in" };
            }
            // Map nested category data to flat user fields
            const updateFields: Record<string, unknown> = {};

            if (body.timeFormat !== undefined) updateFields.timeFormat = body.timeFormat;
            if (body.firstDayOfWeek !== undefined) updateFields.firstDayOfWeek = body.firstDayOfWeek;

            if (body.displayName !== undefined) updateFields.displayName = body.displayName;
            if (body.shortBio !== undefined) updateFields.shortBio = body.shortBio;
            if (body.github !== undefined) updateFields.github = body.github;
            if (body.linkedin !== undefined) updateFields.linkedin = body.linkedin;
            if (body.x !== undefined) updateFields.x = body.x;
            if (body.instagram !== undefined) updateFields.instagram = body.instagram;
            if (body.website !== undefined) updateFields.website = body.website;
            if (body.customTags !== undefined) updateFields.customTags = body.customTags;

            if (body.showAttendance !== undefined) updateFields.showAttendance = body.showAttendance;
            if (body.showResults !== undefined) updateFields.showResults = body.showResults;
            if (body.allowTagInstagram !== undefined) updateFields.allowTagInstagram = body.allowTagInstagram;
            if (body.allowTagLinkedIn !== undefined) updateFields.allowTagLinkedIn = body.allowTagLinkedIn;
            if (body.allowMentionBlog !== undefined) updateFields.allowMentionBlog = body.allowMentionBlog;
            if (body.showProfilePublicly !== undefined) updateFields.showProfilePublicly = body.showProfilePublicly;
            if (body.photoConsent !== undefined) updateFields.photoConsent = body.photoConsent;
            if (body.allowAnonUsage !== undefined) updateFields.allowAnonUsage = body.allowAnonUsage;

            if (body.dietary !== undefined) updateFields.dietary = body.dietary;
            if (body.tshirtSize !== undefined) updateFields.tshirtSize = body.tshirtSize;

            // if (body.scoreboardNickname !== undefined) updateFields.scoreboardNickname = body.scoreboardNickname;
            // if (body.anonymousOnScoreboard !== undefined) updateFields.anonymousOnScoreboard = body.anonymousOnScoreboard;
            // if (body.showRankings !== undefined) updateFields.showRankings = body.showRankings;

            if (body.emailMentions !== undefined) updateFields.emailMentions = body.emailMentions;
            if (body.weeklyNewsletter !== undefined) updateFields.weeklyNewsletter = body.weeklyNewsletter;
            // Always enforce urgentAlerts as true
            if (body.urgentAlerts !== undefined) updateFields.urgentAlerts = true;

            if (body.highContrast !== undefined) updateFields.highContrast = body.highContrast;
            if (body.reducedMotion !== undefined) updateFields.reducedMotion = body.reducedMotion;
            if (body.dyslexicFont !== undefined) updateFields.dyslexicFont = body.dyslexicFont;
            if (body.daltonismMode !== undefined) updateFields.daltonismMode = body.daltonismMode;

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
            body: t.Partial(UserSettingsFlatSchema),
            response: {
                200: UserSettingsSchema,
                401: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Settings"]
            }
        }
    );
