"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container } from "#/components/pages/admin/AdminFormPage.styles";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import { AdminHackathon } from "./AdminHackathonsPage";

export type HackathonFormData = {
    title: string;
    slug: string;
    date: string;
    endDate?: string | null;
    location?: string | null;
};

interface AdminHackathonsFormPageProps {
    id?: string;
    initialData?: Partial<AdminHackathon>;
}

const formatDateForInput = (date?: Date | string | number) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function AdminHackathonsFormPage({ id, initialData }: AdminHackathonsFormPageProps) {
    const router = useRouter();
    const [data, setData] = useState<HackathonFormData>({
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        date: formatDateForInput(initialData?.date || new Date()),
        endDate: formatDateForInput(initialData?.endDate || undefined),
        location: initialData?.location || ""
    });
    const [submitting, setSubmitting] = useState(false);
    const isEdit = !!id;

    if (isEdit) {
        useRegisterBreadcrumbs(
            data.title
                ? [
                      {
                          label: data.title,
                          href: `/admin/hackathons/edit/${id}`
                      }
                  ]
                : []
        );
    }

    const fields: FieldConfig<HackathonFormData>[] = [
        {
            name: "title",
            label: m["admin.hackathons.form.title"](),
            type: "text",
            required: true,
            gridColumn: "span 8"
        },
        {
            name: "slug",
            label: m["admin.hackathons.form.slug"](),
            type: "text",
            required: true,
            pattern: "[a-z0-9-]+",
            fontFamily: "monospace",
            gridColumn: "span 4"
        },
        {
            name: "date",
            label: m["admin.hackathons.form.date"](),
            type: "date",
            required: true,
            gridColumn: "span 6"
        },
        {
            name: "endDate",
            label: m["admin.hackathons.form.endDate"](),
            type: "date",
            gridColumn: "span 6"
        },
        {
            name: "location",
            label: m["admin.hackathons.form.location"](),
            type: "text",
            gridColumn: "span 12"
        }
    ];

    const handleSubmit = async (formData: HackathonFormData | Partial<HackathonFormData>) => {
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                date: formData.date ? new Date(formData.date) : undefined,
                endDate: formData.endDate ? new Date(formData.endDate) : null
            };

            let result;
            if (isEdit) {
                result = await api.admin.hackathons({ id }).patch(payload);
            } else {
                result = await api.admin.hackathons.post(payload as any);
            }

            const { error } = result;
            if (!error) {
                newSuccessToast(isEdit ? m["admin.hackathons.toasts.updated"]() : m["admin.hackathons.toasts.created"]());
                router.push("/admin/hackathons");
                router.refresh();
            } else {
                const errorMsg = typeof error.value === "object" && "error" in error.value ? error.value.error : "Error";
                newErrorToast(errorMsg || (isEdit ? m["admin.hackathons.toasts.updateError"]() : m["admin.hackathons.toasts.createError"]()));
            }
        } catch (e) {
            console.error("Submit error:", e);
            newErrorToast(isEdit ? m["admin.hackathons.toasts.updateError"]() : m["admin.hackathons.toasts.createError"]());
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container>
            <AdminFormBuilder
                title={isEdit ? m["admin.hackathons.page.editTitle"]() : m["admin.hackathons.page.createTitle"]()}
                id={id}
                resource="admin.hackathons"
                action={isEdit ? "update" : "create"}
                fields={fields}
                data={data}
                onChange={setData}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/admin/hackathons")}
                submitting={submitting}
                disabled={isEdit && initialData?.isActive === false}
                submitLabel={m["admin.hackathons.form.save"]()}
                cancelLabel={m["admin.hackathons.form.cancel"]()}
                savingLabel={m["admin.hackathons.form.saving"]()}
            />
        </Container>
    );
}
