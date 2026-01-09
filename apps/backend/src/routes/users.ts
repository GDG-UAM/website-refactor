import { Elysia, t } from "elysia";
import db from "../lib/db";
import { permissionsPlugin } from "../plugins/permissions";

export const userRoutes = new Elysia({ prefix: "/users" })
    // Get team members (users with team or admin role)
    .get(
        "/team",
        async () => {
            try {
                const { userRepository } = db.getRepositories();

                // Find users with team or admin role
                const users = await userRepository.getTeam();

                // Transform to return _id as string
                const teamUsers = users.map((user) => ({
                    _id: user._id.toString(),
                    name: user.name || "",
                    image: user.image || "",
                    role: user.role || "",
                    showProfilePublicly: user.showProfilePublicly ?? true
                }));

                return teamUsers;
            } catch (error) {
                console.error("Failed to fetch team members:", error);
                return [];
            }
        },
        {
            response: {
                200: t.Array(
                    t.Object({
                        _id: t.String(),
                        name: t.String(),
                        image: t.String(),
                        role: t.String(),
                        showProfilePublicly: t.Boolean()
                    })
                )
            }
        }
    )
    .use(permissionsPlugin)
    .get(
        "/:userId",
        async ({ ability, params, set }) => {
            try {
                const { userRepository } = db.getRepositories();
                const userId = params.userId;

                const user = await userRepository.findById(userId);
                if (!user) {
                    set.status = 404;
                    return { error: "User not found" };
                }

                // Check permissions: read on users.{userId} or users.*
                if (!user.showProfilePublicly && ability.cannot("read", `users.${userId}`)) {
                    set.status = 403;
                    return { error: "Forbidden" };
                }

                return {
                    _id: user._id.toString(),
                    role: (user.role || "user") as "user" | "team" | "organizer",
                    name: user.displayName || user.name || "",
                    shortBio: user.shortBio || "",
                    image: user.image || "",
                    showProfilePublicly: user.showProfilePublicly ?? true,
                    github: user.github || "",
                    linkedin: user.linkedin || "",
                    x: user.x || "",
                    instagram: user.instagram || "",
                    website: user.website || "",
                    customTags: user.customTags || []
                };
            } catch (error) {
                console.error("Error fetching user profile:", error);
                set.status = 500;
                return { error: "Internal Server Error" };
            }
        },
        {
            response: {
                200: t.Object({
                    _id: t.String(),
                    role: t.Union([t.Literal("user"), t.Literal("team"), t.Literal("organizer")]),
                    name: t.String(),
                    shortBio: t.String(),
                    image: t.String(),
                    showProfilePublicly: t.Boolean(),
                    github: t.String(),
                    linkedin: t.String(),
                    x: t.String(),
                    instagram: t.String(),
                    website: t.String(),
                    customTags: t.Array(t.String())
                }),
                403: t.Object({ error: t.String() }),
                500: t.Object({ error: t.String() })
            },
            params: t.Object({ userId: t.String() })
        }
    )
    .get(
        "/mentions/:id",
        async ({ params: { id }, query: { ignoreBlogMentions }, set, ability }) => {
            try {
                const { userRepository } = db.getRepositories();
                const user = await userRepository.findById(id);

                if (!user) {
                    set.status = 404;
                    return { error: "User not found" };
                }

                if (
                    !user.allowMentionBlog &&
                    !(ignoreBlogMentions && (ability.can("read", `users.${user._id.toString()}`) || ability.can("read", `admin.users.${user._id.toString()}`)))
                ) {
                    return { _id: user._id.toString() }; // Found but disallows blog mentions
                }

                return {
                    _id: user._id.toString(),
                    name: user.displayName || user.name || "",
                    image: user.image || "",
                    showProfilePublicly: user.showProfilePublicly ?? true
                };
            } catch {
                set.status = 500;
                return { error: "Internal Server Error" };
            }
        },
        {
            params: t.Object({
                id: t.String()
            }),
            query: t.Object({
                ignoreBlogMentions: t.Optional(t.Boolean({ default: false }))
            }),
            response: {
                200: t.Object({
                    _id: t.String(),
                    name: t.Optional(t.String()),
                    image: t.Optional(t.String()),
                    showProfilePublicly: t.Optional(t.Boolean())
                }),
                500: t.Object({ error: t.String() })
            }
        }
    );
