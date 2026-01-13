"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container } from "#/components/pages/admin/AdminFormPage.styles";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import { getDesignOptions } from "#/components/certificates/CertificateDesigns";

const TYPE_ORDER = ["PARTICIPATION", "COURSE_COMPLETION", "EVENT_ACHIEVEMENT", "VOLUNTEER"];

const nestData = (flatData: any) => {
    const nested = { ...flatData };
    const metadata: any = { ...(flatData.metadata || {}) };

    // Support both direct objects and flattened keys
    Object.keys(flatData).forEach((key) => {
        if (key.startsWith("metadata.")) {
            const subKey = key.split(".")[1];
            metadata[subKey] = flatData[key];
            delete nested[key];
        }
    });

    nested.metadata = metadata;

    // Ensure metadata and signatures are objects/arrays and not strings
    if (typeof nested.metadata === "string") {
        try {
            nested.metadata = JSON.parse(nested.metadata);
        } catch {
            nested.metadata = {};
        }
    }
    if (typeof nested.signatures === "string") {
        try {
            nested.signatures = JSON.parse(nested.signatures);
        } catch {
            nested.signatures = [];
        }
    }

    return nested;
};

export function AdminCertificatesFormPage({ id, initialData }: { id?: string; initialData?: any }) {
    const router = useRouter();
    const isEdit = !!id;

    const [data, setData] = useState(() => {
        const base = {
            recipientUserId: initialData?.recipient?.userId ? [initialData.recipient.userId] : [],
            recipientName: initialData?.recipient?.name || "",
            type: initialData?.type || "PARTICIPATION",
            title: initialData?.title || "",
            description: initialData?.description || "",
            designId: initialData?.designId || 0,
            startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : "",
            endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split("T")[0] : "",
            signatures: initialData?.signatures || [],
            metadata: initialData?.metadata || {}
        };

        // Handle cases where they might be strings (from DB legacy or error)
        if (typeof base.metadata === "string") {
            try {
                base.metadata = JSON.parse(base.metadata);
            } catch {
                base.metadata = {};
            }
        }
        if (typeof base.signatures === "string") {
            try {
                base.signatures = JSON.parse(base.signatures);
            } catch {
                base.signatures = [];
            }
        }

        // Flatten metadata for form fields (e.g. metadata.hours)
        if (base.metadata && typeof base.metadata === "object") {
            Object.entries(base.metadata).forEach(([key, val]) => {
                (base as any)[`metadata.${key}`] = val;
            });
        }

        return base;
    });
    const [submitting, setSubmitting] = useState(false);

    const [direction, setDirection] = useState(0);

    const handleChange = (newData: any) => {
        if (newData.type !== data.type) {
            const prevIndex = TYPE_ORDER.indexOf(data.type);
            const currIndex = TYPE_ORDER.indexOf(newData.type);
            setDirection(currIndex > prevIndex ? 1 : -1);
        }
        setData(newData);
    };

    // Resolve recipient name when userId changes
    useEffect(() => {
        const userId = data.recipientUserId?.[0];
        if (!userId) return;

        // If it's a raw string (not ObjectId), just use it as the name
        if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
            setData((prev) => (prev.recipientName !== userId ? { ...prev, recipientName: userId } : prev));
            return;
        }

        // Otherwise fetch user info
        let ignore = false;
        api.users
            .mentions({ id: userId })
            .get({ query: { ignoreBlogMentions: true } })
            .then(({ data: user }) => {
                if (!ignore && user && "name" in user && user.name) {
                    setData((prev) => (prev.recipientName !== user.name ? { ...prev, recipientName: user.name } : prev));
                }
            });

        return () => {
            ignore = true;
        };
    }, [data.recipientUserId]);

    useRegisterBreadcrumbs(
        isEdit
            ? [
                  {
                      label: `${initialData?.recipient?.name} - ${data?.title} (${(m[`admin.certificates.types.${data.type}` as keyof typeof m] as any)()})`,
                      href: `/admin/certificates/${id}`,
                      warning: initialData?.isActive === false ? m["admin.certificates.form.deletedWarning"]() : undefined
                  }
              ]
            : []
    );

    const getExtraFields = (): FieldConfig<any>[] => {
        const extra: FieldConfig<any>[] = [];

        if (data.type === "COURSE_COMPLETION") {
            extra.push(
                { name: "metadata.hours", label: m["admin.certificates.form.hours"](), type: "number", gridColumn: "span 6" },
                { name: "metadata.grade", label: m["admin.certificates.form.grade"](), type: "text", gridColumn: "span 6" }
            );
        } else if (data.type === "EVENT_ACHIEVEMENT") {
            extra.push(
                { name: "metadata.rank", label: m["admin.certificates.form.rank"](), type: "text", gridColumn: "span 6" },
                { name: "metadata.group", label: m["admin.certificates.form.group"](), type: "text", gridColumn: "span 6" }
            );
        } else if (data.type === "PARTICIPATION") {
            extra.push({
                name: "metadata.role",
                label: m["admin.certificates.form.role"](),
                type: "select",
                gridColumn: "span 12",
                options: [
                    { label: m["admin.certificates.form.roles.ATTENDEE"](), value: "ATTENDEE" },
                    { label: m["admin.certificates.form.roles.PARTICIPANT"](), value: "PARTICIPANT" },
                    { label: m["admin.certificates.form.roles.SPEAKER"](), value: "SPEAKER" },
                    { label: m["admin.certificates.form.roles.ORGANIZER"](), value: "ORGANIZER" }
                ]
            });
        } else if (data.type === "VOLUNTEER") {
            extra.push({ name: "metadata.hours", label: m["admin.certificates.form.hours"](), type: "number", gridColumn: "span 12" });
        }

        return extra;
    };

    const fields: FieldConfig<any>[] = [
        {
            name: "recipientUserId",
            label: m["admin.certificates.form.recipient"](),
            type: "user-selector",
            required: true,
            maxItems: 1,
            allowRawStrings: true,
            gridColumn: "span 12"
        },
        {
            name: "title",
            label: m["admin.certificates.form.title"](),
            type: "text",
            required: false,
            placeholder:
                typeof m[`admin.certificates.types.${data.type}` as keyof typeof m] === "function"
                    ? (m[`admin.certificates.types.${data.type}` as keyof typeof m] as any)()
                    : data.type,
            gridColumn: "span 8"
        },
        {
            name: "designId",
            label: m["admin.certificates.form.designId"](),
            type: "select",
            gridColumn: "span 4",
            options: getDesignOptions()
        },
        {
            name: "description",
            label: m["admin.certificates.form.description"](),
            type: "multiline",
            gridColumn: "span 12"
        },
        {
            name: "startDate",
            label: m["admin.certificates.form.startDate"](),
            type: "date",
            gridColumn: "span 6"
        },
        {
            name: "endDate",
            label: m["admin.certificates.form.endDate"](),
            type: "date",
            gridColumn: "span 6"
        },
        {
            name: "type",
            label: m["admin.certificates.form.type"](),
            type: "choice",
            required: true,
            gridColumn: "span 12",
            options: [
                { label: m["admin.certificates.types.PARTICIPATION"](), value: "PARTICIPATION" },
                { label: m["admin.certificates.types.COURSE_COMPLETION"](), value: "COURSE_COMPLETION" },
                { label: m["admin.certificates.types.EVENT_ACHIEVEMENT"](), value: "EVENT_ACHIEVEMENT" },
                { label: m["admin.certificates.types.VOLUNTEER"](), value: "VOLUNTEER" }
            ]
        },
        {
            name: "dynamicFields",
            label: "",
            type: "group",
            gridColumn: "span 12",
            animated: true,
            animationKey: data.type,
            animationDirection: direction,
            fields: getExtraFields()
        } as FieldConfig<any>,
        {
            name: "signatures",
            label: m["admin.certificates.form.signatures"](),
            type: "table",
            gridColumn: "span 12",
            columns: [
                { name: "name", label: "Name", type: "text", required: true },
                { name: "role", label: "Role", type: "text", required: true },
                { name: "imageUrl", label: "Image URL", type: "text", required: true }
            ],
            addButtonLabel: m["admin.certificates.form.addSignature"]()
        }
    ];

    const handleSubmit = async (formData: any) => {
        setSubmitting(true);
        try {
            const nested = nestData(formData);
            const rawRecipient = nested.recipientUserId?.[0];
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(rawRecipient);

            const payload = {
                ...nested,
                recipient: {
                    name: data.recipientName || rawRecipient || "Unknown",
                    userId: isObjectId ? rawRecipient : undefined
                },
                startDate: nested.startDate ? new Date(nested.startDate) : null,
                endDate: nested.endDate ? new Date(nested.endDate) : null
            };

            delete (payload as any).recipientUserId;
            delete (payload as any).recipientName;

            let result;
            if (isEdit) {
                result = await api.admin.certificates({ id }).patch(payload);
            } else {
                result = await api.admin.certificates.post(payload);
            }

            if (!result.error) {
                newSuccessToast(isEdit ? m["admin.certificates.toasts.updated"]() : m["admin.certificates.toasts.created"]());
                router.push("/admin/certificates");
            } else {
                newErrorToast(m["admin.certificates.toasts.error"]());
            }
        } catch (e) {
            newErrorToast(m["admin.certificates.toasts.error"]());
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container>
            <AdminFormBuilder
                title={isEdit ? m["admin.certificates.page.editTitle"]() : m["admin.certificates.page.createTitle"]()}
                id={id}
                resource="admin.certificates"
                action={isEdit ? "update" : "create"}
                fields={fields}
                data={data}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/admin/certificates")}
                submitting={submitting}
                disabled={initialData?.isActive === false || initialData?.source === "auto"}
                submitLabel={m["admin.certificates.form.save"]()}
                cancelLabel={m["admin.certificates.form.cancel"]()}
                savingLabel={m["admin.certificates.form.saving"]()}
            />
        </Container>
    );
}
