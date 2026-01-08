"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminFormPage.styles";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import { AdminLink } from "./AdminLinksPage";

export type LinkFormData = Omit<AdminLink, "_id" | "isActive" | "clicks" | "order" | "createdBy" | "createdAt" | "updatedAt">;

interface AdminLinksFormPageProps {
    id?: string;
    initialData?: Partial<AdminLink>;
}

export function AdminLinksFormPage({ id, initialData }: AdminLinksFormPageProps) {
    const router = useRouter();
    const [data, setData] = useState<LinkFormData>({
        slug: initialData?.slug || "",
        destination: initialData?.destination || "",
        title: initialData?.title || "",
        description: initialData?.description || ""
    });
    const [submitting, setSubmitting] = useState(false);
    const isEdit = !!id;

    useRegisterBreadcrumbs(
        isEdit && data.title
            ? [
                  {
                      label: data.title,
                      href: `/admin/links/${id}`
                  }
              ]
            : []
    );

    const fields: FieldConfig<LinkFormData>[] = [
        {
            name: "title",
            label: m["admin.links.form.title"](),
            type: "text",
            required: true,
            helperText: m["admin.links.form.titleHelp"](),
            gridColumn: "span 8"
        },
        {
            name: "slug",
            label: m["admin.links.form.slug"](),
            type: "text",
            required: true,
            helperText: m["admin.links.form.slugHelp"](),
            pattern: "[a-z0-9-]+",
            fontFamily: "monospace",
            gridColumn: "span 4"
        },
        {
            name: "destination",
            label: m["admin.links.form.destination"](),
            type: "url",
            required: true,
            helperText: m["admin.links.form.destinationHelp"](),
            gridColumn: "span 12"
        },
        {
            name: "description",
            label: m["admin.links.form.description"](),
            type: "multiline",
            rows: 3,
            helperText: m["admin.links.form.descriptionHelp"](),
            gridColumn: "span 12"
        }
    ];

    const handleSubmit = async (formData: LinkFormData | Partial<LinkFormData>) => {
        setSubmitting(true);
        try {
            let result;
            if (isEdit) {
                result = await api.admin.links({ id }).patch(formData);
            } else {
                result = await api.admin.links.post(formData as LinkFormData);
            }

            const { error } = result;
            if (!error) {
                newSuccessToast(isEdit ? m["admin.links.toasts.updated"]() : m["admin.links.toasts.created"]());
                router.push("/admin/links");
                router.refresh();
            } else {
                const errorMsg = typeof error.value === "object" && "error" in error.value ? error.value.error : "Error";
                newErrorToast(errorMsg || (isEdit ? m["admin.links.toasts.updateError"]() : m["admin.links.toasts.createError"]()));
            }
        } catch (e) {
            console.error("Submit error:", e);
            newErrorToast(isEdit ? m["admin.links.toasts.updateError"]() : m["admin.links.toasts.createError"]());
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container>
            <AdminFormBuilder
                title={isEdit ? m["admin.links.page.editTitle"]() : m["admin.links.page.createTitle"]()}
                id={id}
                resource="admin.links"
                action={isEdit ? "update" : "create"}
                fields={fields}
                data={data}
                onChange={setData}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/admin/links")}
                submitting={submitting}
                disabled={isEdit && initialData?.isActive === false}
                submitLabel={m["admin.links.form.save"]()}
                cancelLabel={m["admin.links.form.cancel"]()}
                savingLabel={m["admin.links.form.saving"]()}
            />
        </Container>
    );
}
