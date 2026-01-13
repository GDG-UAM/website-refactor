import { Elysia, t } from "elysia";
import db from "../lib/db";
import { CertificateSchema } from "../repositories/types";

export const publicCertificateRoutes = new Elysia({ prefix: "/certificates" }).get(
    "/:id",
    async ({ params: { id }, set }) => {
        const { certificateRepository } = db.getRepositories();

        // Validate ID format
        if (!/^[a-f0-9]{24}$/.test(id)) {
            set.status = 404;
            return { error: "Certificate not found" };
        }

        const certificate = await certificateRepository.findById(id);
        if (!certificate) {
            set.status = 404;
            return { error: "Certificate not found" };
        }

        return {
            ...certificate,
            _id: certificate._id.toString(),
            templateId: certificate.templateId?.toString(),
            startDate: certificate.startDate?.toISOString(),
            endDate: certificate.endDate?.toISOString(),
            createdAt: certificate.createdAt.toISOString(),
            updatedAt: certificate.updatedAt.toISOString()
        };
    },
    {
        params: t.Object({
            id: t.String()
        }),
        response: {
            200: t.Object({
                ...CertificateSchema.properties,
                _id: t.String(),
                templateId: t.Optional(t.String()),
                startDate: t.Optional(t.String()),
                endDate: t.Optional(t.String()),
                createdAt: t.String(),
                updatedAt: t.String()
            }),
            404: t.Object({ error: t.String() })
        },
        detail: {
            tags: ["Certificates"]
        }
    }
);
