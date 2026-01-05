import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { validatePattern } from "@gdg-uam/permissions";
import { checkPermission } from "../../lib/permissions";
import { permissionsPlugin } from "../../plugins/permissions";
import { ActionsSchema } from "../../repositories/types";

export const permissionTemplateRoutes = new Elysia({ prefix: "/templates" })
    .use(permissionsPlugin)
    // List all templates
    .get("/", async ({ user, ability, set }) => {
        if (!user) {
            set.status = 401;
            return { error: "Not logged in" };
        }

        try {
            checkPermission(ability, "read", "FeatureFlag"); // Admin-only

            const { permissionTemplateRepository } = db.getRepositories();
            const templates = await permissionTemplateRepository.findAll();

            return { templates };
        } catch (error: unknown) {
            set.status = 403;
            return { error: error instanceof Error ? error.message : "Forbidden" };
        }
    })

    // Get single template
    .get(
        "/:id",
        async ({ params, user, ability, set }) => {
            if (!user) {
                set.status = 401;
                return { error: "Not logged in" };
            }

            try {
                checkPermission(ability, "read", "FeatureFlag");

                const { permissionTemplateRepository } = db.getRepositories();
                const template = await permissionTemplateRepository.findById(params.id);

                if (!template || !template.isActive) {
                    set.status = 404;
                    return { error: "Template not found" };
                }

                return { template };
            } catch (error: unknown) {
                set.status = 403;
                return { error: error instanceof Error ? error.message : "Forbidden" };
            }
        },
        {
            params: t.Object({
                id: t.String()
            })
        }
    )

    // Create template
    .post(
        "/",
        async ({ body, user, ability, set }) => {
            if (!user) {
                set.status = 401;
                return { error: "Not logged in" };
            }

            try {
                checkPermission(ability, "create", "FeatureFlag");

                // Validate pattern syntax
                const validation = validatePattern(body.pattern);
                if (!validation.valid) {
                    set.status = 400;
                    return { error: validation.error };
                }

                // Check for overlapping actions
                const overlap = body.grants.filter((action) => body.denies?.includes(action));
                if (overlap.length > 0) {
                    set.status = 400;
                    return {
                        error: `Actions cannot be both granted and denied: ${overlap.join(", ")}`
                    };
                }

                const { permissionTemplateRepository } = db.getRepositories();
                const template = await permissionTemplateRepository.create({
                    name: body.name,
                    description: body.description,
                    pattern: body.pattern,
                    grants: body.grants,
                    denies: body.denies || [],
                    conditions: body.conditions,
                    isActive: true,
                    usageCount: 0
                });

                return {
                    success: true,
                    template
                };
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                set.status = message.includes("Forbidden") ? 403 : 400;
                return { error: message };
            }
        },
        {
            body: t.Object({
                name: t.String({ minLength: 1, maxLength: 100 }),
                description: t.Optional(t.String({ maxLength: 500 })),
                pattern: t.String({
                    minLength: 1,
                    pattern: "^[a-z]+(\\.\\{[a-z]+\\}|\\.\\*|\\.[\\w-]+)*$"
                }),
                grants: t.Array(ActionsSchema),
                denies: t.Optional(t.Array(ActionsSchema)),
                conditions: t.Optional(t.Record(t.String(), t.Any()))
            })
        }
    )

    // Update template
    .patch(
        "/:id",
        async ({ params, body, user, ability, set }) => {
            if (!user) {
                set.status = 401;
                return { error: "Not logged in" };
            }

            try {
                checkPermission(ability, "update", "FeatureFlag");

                const { permissionTemplateRepository } = db.getRepositories();
                const existing = await permissionTemplateRepository.findById(params.id);

                if (!existing || !existing.isActive) {
                    set.status = 404;
                    return { error: "Template not found" };
                }

                // Validate pattern if provided
                if (body.pattern) {
                    const validation = validatePattern(body.pattern);
                    if (!validation.valid) {
                        set.status = 400;
                        return { error: validation.error };
                    }
                }

                const template = await permissionTemplateRepository.updateById(params.id, body);

                return {
                    success: true,
                    template
                };
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                set.status = message.includes("Forbidden") ? 403 : 400;
                return { error: message };
            }
        },
        {
            params: t.Object({
                id: t.String()
            }),
            body: t.Partial(
                t.Object({
                    name: t.String({ minLength: 1, maxLength: 100 }),
                    description: t.String({ maxLength: 500 }),
                    pattern: t.String(),
                    grants: t.Array(ActionsSchema),
                    denies: t.Array(ActionsSchema),
                    conditions: t.Record(t.String(), t.Any())
                })
            )
        }
    )

    // Delete template (soft delete)
    .delete(
        "/:id",
        async ({ params, user, ability, set }) => {
            if (!user) {
                set.status = 401;
                return { error: "Not logged in" };
            }

            try {
                checkPermission(ability, "delete", "FeatureFlag");

                const { permissionTemplateRepository } = db.getRepositories();
                const success = await permissionTemplateRepository.deleteById(params.id);

                if (!success) {
                    set.status = 404;
                    return { error: "Template not found" };
                }

                // TODO: Also mark derived permissions as inactive
                // await Permission.updateMany(
                //   { templateId: params.id },
                //   { $set: { isActive: false } }
                // );

                return {
                    success: true,
                    message: "Template deleted successfully"
                };
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                set.status = message.includes("Forbidden") ? 403 : 400;
                return { error: message };
            }
        },
        {
            params: t.Object({
                id: t.String()
            })
        }
    );
