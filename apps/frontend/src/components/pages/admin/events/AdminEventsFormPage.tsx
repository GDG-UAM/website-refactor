"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminFormPage.styles";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";

import { AdminEvent } from "./AdminEventsPage";

export type EventFormData = Omit<
    AdminEvent,
    "date" | "_id" | "isActive" | "createdBy" | "createdAt" | "updatedAt" | "imageBlurHash" | "imageWidth" | "imageHeight"
> & {
    date: string;
};

interface AdminEventsFormPageProps {
    id?: string;
    initialData?: Partial<AdminEvent>;
}

const formatDateForInput = (date?: Date | string | number) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function AdminEventsFormPage({ id, initialData }: AdminEventsFormPageProps) {
    const router = useRouter();
    const [data, setData] = useState<EventFormData>({
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        description: initialData?.description || "",
        date: formatDateForInput(initialData?.date || new Date()),
        location: initialData?.location || "",
        image: initialData?.image || "",
        status: initialData?.status || "draft",
        url: initialData?.url || "",
        markdownContent: initialData?.markdownContent || "",
        blogUrl: initialData?.blogUrl || ""
    });
    const [submitting, setSubmitting] = useState(false);
    const isEdit = !!id;

    useRegisterBreadcrumbs(
        isEdit && data.title
            ? [
                  {
                      label: data.title,
                      href: `/admin/events/${id}`
                  }
              ]
            : []
    );

    const fields: FieldConfig<EventFormData>[] = [
        {
            name: "title",
            label: m["admin.events.form.title"](),
            type: "text",
            required: true,
            gridColumn: "span 8"
        },
        {
            name: "slug",
            label: m["admin.events.form.slug"](),
            type: "text",
            required: true,
            pattern: "[a-z0-9-]+",
            fontFamily: "monospace",
            gridColumn: "span 4"
        },
        {
            name: "description",
            label: m["admin.events.form.description"](),
            type: "multiline",
            rows: 3,
            gridColumn: "span 12"
        },
        {
            name: "date",
            label: m["admin.events.form.date"](),
            type: "datetime",
            required: true,
            gridColumn: "span 6"
        },
        {
            name: "location",
            label: m["admin.events.form.location"](),
            type: "text",
            gridColumn: "span 6"
        },
        {
            name: "image",
            label: m["admin.events.form.image"](),
            type: "url",
            gridColumn: "span 8"
        },
        {
            name: "status",
            label: m["admin.events.form.status"](),
            type: "select",
            options: [
                { label: m["admin.events.list.status_draft"](), value: "draft" },
                { label: m["admin.events.list.status_published"](), value: "published" }
            ],
            required: true,
            gridColumn: "span 4"
        },
        {
            name: "url",
            label: m["admin.events.form.url"](),
            type: "url",
            gridColumn: "span 6"
        },
        {
            name: "blogUrl",
            label: m["admin.events.form.blogUrl"](),
            type: "url",
            gridColumn: "span 6"
        },
        {
            name: "markdownContent",
            label: m["admin.events.form.markdownContent"](),
            type: "markdown",
            rows: 8,
            required: true,
            gridColumn: "span 12"
        }
    ];

    const handleSubmit = async (formData: EventFormData | Partial<EventFormData>) => {
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                date: formData.date ? new Date(formData.date) : undefined
            };

            let result;
            if (isEdit) {
                result = await api.admin.events({ id }).patch(payload);
            } else {
                result = await api.admin.events.post(payload as any); // post() might need mandatory fields that Omit removed
            }

            const { error } = result;
            if (!error) {
                newSuccessToast(isEdit ? m["admin.events.toasts.updated"]() : m["admin.events.toasts.created"]());
                router.push("/admin/events");
                router.refresh();
            } else {
                const errorMsg = typeof error.value === "object" && "error" in error.value ? error.value.error : "Error";
                newErrorToast(errorMsg || (isEdit ? m["admin.events.toasts.updateError"]() : m["admin.events.toasts.createError"]()));
            }
        } catch (e) {
            console.error("Submit error:", e);
            newErrorToast(isEdit ? m["admin.events.toasts.updateError"]() : m["admin.events.toasts.createError"]());
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container>
            <AdminFormBuilder
                title={isEdit ? m["admin.events.page.editTitle"]() : m["admin.events.page.createTitle"]()}
                id={id}
                resource="admin.events"
                action={isEdit ? "update" : "create"}
                fields={fields}
                data={data}
                onChange={setData}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/admin/events")}
                submitting={submitting}
                disabled={isEdit && initialData?.isActive === false}
                submitLabel={m["admin.events.form.save"]()}
                cancelLabel={m["admin.events.form.cancel"]()}
                savingLabel={m["admin.events.form.saving"]()}
            />
        </Container>
    );
}
