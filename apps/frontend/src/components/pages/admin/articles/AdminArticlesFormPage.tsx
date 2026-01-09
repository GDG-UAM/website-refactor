"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container } from "#/components/pages/admin/AdminFormPage.styles";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import { AdminArticle } from "./AdminArticlesPage";

export type ArticleFormData = Omit<
    AdminArticle,
    "_id" | "isActive" | "createdBy" | "createdAt" | "updatedAt" | "views" | "coverImageBlurHash" | "coverImageWidth" | "coverImageHeight" | "publishedAt"
> & {
    publishedAt?: string | null;
};

interface AdminArticlesFormPageProps {
    type: "blog" | "newsletter";
    id?: string;
    initialData?: Partial<AdminArticle>;
}

const formatDateForInput = (date?: Date | string | number | null) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function AdminArticlesFormPage({ type, id, initialData }: AdminArticlesFormPageProps) {
    const router = useRouter();
    const [data, setData] = useState<ArticleFormData>({
        type: type,
        title: initialData?.title || {},
        slug: initialData?.slug || "",
        excerpt: initialData?.excerpt || {},
        content: initialData?.content || {},
        coverImage: initialData?.coverImage || "",
        status: initialData?.status || "draft",
        authors: initialData?.authors || [],
        publishedAt: formatDateForInput(initialData?.publishedAt) || undefined
    });
    const [submitting, setSubmitting] = useState(false);
    const isEdit = !!id;

    const displayTitle = initialData?.title && Object.values(initialData.title)[0];

    useRegisterBreadcrumbs(
        isEdit && displayTitle
            ? [
                  {
                      label: displayTitle,
                      href: `/admin/${type}/${id}`
                  }
              ]
            : []
    );

    const formStatusOptions = [
        { label: m["admin.articles.status.draft"](), value: "draft" },
        { label: m["admin.articles.status.published"](), value: "published" }
    ];
    if (type === "blog") {
        formStatusOptions.push({ label: m["admin.articles.status.url_only"](), value: "url_only" });
    }

    const fields: FieldConfig<ArticleFormData>[] = [
        {
            name: "slug",
            label: m["admin.articles.form.slug"](),
            type: "text",
            pattern: "[a-z0-9-]+",
            fontFamily: "monospace",
            gridColumn: "span 4",
            helperText: "Leave empty to auto-generate from title"
        },
        {
            name: "coverImage",
            label: "Cover Image URL",
            type: "url",
            gridColumn: "span 8"
        },
        {
            name: "status",
            label: m["admin.articles.form.status"](),
            type: "select",
            options: formStatusOptions,
            required: true,
            gridColumn: "span 6"
        },
        {
            name: "publishedAt",
            label: m["admin.articles.form.date"](),
            type: "datetime",
            gridColumn: "span 6"
        },
        ...(type === "blog"
            ? [
                  {
                      name: "authors",
                      label: m["blog.authors"](),
                      type: "user-selector",
                      required: true,
                      gridColumn: "span 12"
                  } as FieldConfig<ArticleFormData>
              ]
            : [])
    ];

    const localizedFields: FieldConfig<ArticleFormData>[] = [
        {
            name: "title",
            label: m["admin.articles.form.title"](),
            type: "text",
            required: true,
            gridColumn: "span 12"
        },
        {
            name: "excerpt",
            label: m["admin.articles.form.excerpt"](),
            type: "multiline",
            rows: 3,
            gridColumn: "span 12"
        },
        {
            name: "content",
            label: m["admin.articles.form.content"](),
            type: "markdown",
            required: true,
            rows: 15,
            gridColumn: "span 12"
        }
    ];

    const handleSubmit = async (formData: ArticleFormData | Partial<ArticleFormData>) => {
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : formData.status === "published" ? new Date() : undefined
            };

            let result;
            if (isEdit) {
                result = await api.admin.articles({ id }).patch(payload);
            } else {
                result = await api.admin.articles.post(payload as any);
            }

            const { error } = result;
            if (!error) {
                newSuccessToast(isEdit ? m["admin.articles.toasts.updated"]() : m["admin.articles.toasts.created"]());
                router.push(`/admin/${type}`);
                router.refresh();
            } else {
                const errorMsg = typeof error.value === "object" && "error" in error.value ? error.value.error : "Error";
                newErrorToast(errorMsg || (isEdit ? m["admin.articles.toasts.updateError"]() : m["admin.articles.toasts.createError"]()));
            }
        } catch (e) {
            console.error("Submit error:", e);
            newErrorToast(isEdit ? m["admin.articles.toasts.updateError"]() : m["admin.articles.toasts.createError"]());
        } finally {
            setSubmitting(false);
        }
    };

    const formTitle = isEdit
        ? type === "blog"
            ? m["admin.articles.blog.edit"]()
            : m["admin.articles.newsletter.edit"]()
        : type === "blog"
          ? m["admin.articles.blog.create"]()
          : m["admin.articles.newsletter.create"]();

    return (
        <Container>
            <AdminFormBuilder
                title={formTitle}
                id={id}
                resource={`admin.articles.${type}`}
                action={isEdit ? "update" : "create"}
                fields={fields}
                localizedFields={localizedFields}
                data={data}
                onChange={setData}
                onSubmit={handleSubmit}
                onCancel={() => router.push(`/admin/${type}`)}
                submitting={submitting}
                disabled={isEdit && initialData?.isActive === false}
            />
        </Container>
    );
}
