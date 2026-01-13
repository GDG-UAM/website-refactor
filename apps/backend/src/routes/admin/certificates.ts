import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";
import { CertificateSchema, CertificateTemplateSchema, CertificateRecipientSchema } from "../../repositories/types";

const AdminCertificateResponseSchema = t.Object({
    ...CertificateSchema.properties,
    _id: t.String(),
    templateId: t.Optional(t.String()),
    startDate: t.Optional(t.Nullable(t.Union([t.Date(), t.String()]))),
    endDate: t.Optional(t.Nullable(t.Union([t.Date(), t.String()]))),
    createdAt: t.Union([t.Date(), t.String()]),
    updatedAt: t.Union([t.Date(), t.String()])
});

const AdminCertificateTemplateResponseSchema = t.Object({
    ...t.Omit(CertificateTemplateSchema, ["_id", "recipients", "designId", "title"]).properties,
    recipients: t.Optional(t.Nullable(t.Array(CertificateRecipientSchema))),
    designId: t.Optional(t.Nullable(t.Number())),
    title: t.Optional(t.Nullable(t.String())),
    _id: t.String(),
    hackathonId: t.Optional(t.String()),
    teamId: t.Optional(t.String()),
    startDate: t.Optional(t.Nullable(t.Union([t.Date(), t.String()]))),
    endDate: t.Optional(t.Nullable(t.Union([t.Date(), t.String()]))),
    createdAt: t.Union([t.Date(), t.String()]),
    updatedAt: t.Union([t.Date(), t.String()])
});

const CreateCertificateSchema = t.Omit(CertificateSchema, ["_id", "createdBy", "createdAt", "updatedAt", "revoked", "isActive"]);
const CreateCertificateTemplateSchema = t.Object({
    ...t.Omit(CertificateTemplateSchema, ["_id", "createdBy", "createdAt", "updatedAt", "isActive", "recipients", "designId", "title"]).properties,
    recipients: t.Optional(t.Nullable(t.Array(CertificateRecipientSchema))),
    designId: t.Optional(t.Nullable(t.Number())),
    title: t.Optional(t.Nullable(t.String()))
});

export const adminCertificatesRoutes = new Elysia({ prefix: "/certificates" })
    .use(permissionsPlugin)
    // -------------------- Individual Certificates --------------------
    .get(
        "/",
        async ({ query: { page, pageSize, search, includeInactive, templateId, recipient, type, sort }, ability, set }) => {
            if (ability.cannot("read", "admin.certificates")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { certificateRepository } = db.getRepositories();
            const shouldIncludeInactive = includeInactive && ability.can("manage", "admin.certificates");

            const data = await certificateRepository.list({
                page,
                pageSize,
                search,
                includeInactive: shouldIncludeInactive,
                templateId,
                recipient,
                type,
                sort: sort as any
            });

            return {
                ...data,
                items: data.items.map((item) => ({
                    ...item,
                    _id: item._id.toString(),
                    templateId: item.templateId?.toString()
                }))
            };
        },
        {
            query: t.Object({
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 50, minimum: 1, maximum: 100 })),
                search: t.Optional(t.String()),
                includeInactive: t.Optional(t.Boolean()),
                templateId: t.Optional(t.String()),
                recipient: t.Optional(t.String()),
                type: t.Optional(t.String()),
                sort: t.Optional(t.String())
            }),
            response: {
                200: t.Object({
                    items: t.Array(AdminCertificateResponseSchema),
                    total: t.Number(),
                    page: t.Number(),
                    pageSize: t.Number()
                }),
                403: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Certificates"]
            }
        }
    )
    .post(
        "/",
        async ({ body, ability, user, set }) => {
            if (ability.cannot("create", "admin.certificates")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { certificateRepository } = db.getRepositories();
            const certificate = await certificateRepository.create(body as any, user!.id);

            return {
                ...certificate,
                _id: certificate._id.toString(),
                templateId: certificate.templateId?.toString()
            };
        },
        {
            body: CreateCertificateSchema,
            response: {
                200: AdminCertificateResponseSchema,
                403: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Certificates"]
            }
        }
    )
    .get(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("read", `admin.certificates.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { certificateRepository } = db.getRepositories();
            const certificate = await certificateRepository.findById(id, { includeInactive: true });

            if (!certificate) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...certificate,
                _id: certificate._id.toString(),
                templateId: certificate.templateId?.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: AdminCertificateResponseSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Certificates"]
            }
        }
    )
    .patch(
        "/:id",
        async ({ params: { id }, body, ability, set }) => {
            if (ability.cannot("update", `admin.certificates.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { certificateRepository } = db.getRepositories();
            const updated = await certificateRepository.update(id, body as any);

            if (!updated) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...updated,
                _id: updated._id.toString(),
                templateId: updated.templateId?.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Partial(CertificateSchema),
            response: {
                200: AdminCertificateResponseSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Certificates"]
            }
        }
    )
    .delete(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("delete", `admin.certificates.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { certificateRepository } = db.getRepositories();
            const success = await certificateRepository.delete(id);

            if (!success) {
                set.status = 404;
                return { error: "Not found" };
            }

            return { success: true };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: t.Object({ success: t.Boolean() }),
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Certificates"]
            }
        }
    )
    // -------------------- Certificate Templates --------------------
    .get(
        "/templates",
        async ({ query: { page, pageSize, search, includeInactive, teamId, hackathonId }, ability, set }) => {
            if (ability.cannot("read", "admin.certificates.templates")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { certificateTemplateRepository } = db.getRepositories();
            const shouldIncludeInactive = includeInactive && ability.can("manage", "admin.certificates.templates");

            const data = await certificateTemplateRepository.list({
                page,
                pageSize,
                search,
                includeInactive: shouldIncludeInactive,
                teamId,
                hackathonId
            });

            return {
                ...data,
                items: data.items.map((item) => ({
                    ...item,
                    _id: item._id.toString(),
                    hackathonId: item.hackathonId?.toString(),
                    teamId: item.teamId?.toString()
                }))
            };
        },
        {
            query: t.Object({
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 50, minimum: 1, maximum: 100 })),
                search: t.Optional(t.String()),
                includeInactive: t.Optional(t.Boolean()),
                teamId: t.Optional(t.String()),
                hackathonId: t.Optional(t.String())
            }),
            response: {
                200: t.Object({
                    items: t.Array(AdminCertificateTemplateResponseSchema),
                    total: t.Number(),
                    page: t.Number(),
                    pageSize: t.Number()
                }),
                403: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Certificates"]
            }
        }
    )
    .get(
        "/templates/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("read", `admin.certificates.templates.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { certificateTemplateRepository } = db.getRepositories();
            const template = await certificateTemplateRepository.findById(id);

            if (!template) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...template,
                _id: template._id.toString(),
                hackathonId: template.hackathonId?.toString(),
                teamId: template.teamId?.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: AdminCertificateTemplateResponseSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Certificates"]
            }
        }
    )
    .post(
        "/templates",
        async ({ body, ability, user, set }) => {
            if (ability.cannot("create", "admin.certificates.templates")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { certificateTemplateRepository } = db.getRepositories();
            const template = await certificateTemplateRepository.create(body as any, user!.id);

            return {
                ...template,
                _id: template._id.toString(),
                hackathonId: template.hackathonId?.toString(),
                teamId: template.teamId?.toString()
            };
        },
        {
            body: CreateCertificateTemplateSchema,
            response: {
                200: AdminCertificateTemplateResponseSchema,
                403: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Certificates"]
            }
        }
    )
    .patch(
        "/templates/:id",
        async ({ params: { id }, body, ability, user, set }) => {
            if (ability.cannot("update", `admin.certificates.templates.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { certificateTemplateRepository } = db.getRepositories();
            const updated = await certificateTemplateRepository.update(id, body as any, user!.id);

            if (!updated) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...updated,
                _id: updated._id.toString(),
                hackathonId: updated.hackathonId?.toString(),
                teamId: updated.teamId?.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Partial(CertificateTemplateSchema),
            response: {
                200: AdminCertificateTemplateResponseSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Certificates"]
            }
        }
    )
    .delete(
        "/templates/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("delete", `admin.certificates.templates.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { certificateTemplateRepository } = db.getRepositories();
            const success = await certificateTemplateRepository.delete(id);

            if (!success) {
                set.status = 404;
                return { error: "Not found" };
            }

            return { success: true };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: t.Object({ success: t.Boolean() }),
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Certificates"]
            }
        }
    );
