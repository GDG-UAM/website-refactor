"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import { Container } from "#/components/pages/admin/AdminFormPage.styles";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import * as m from "#/paraglide/messages";
import { AdminPermissionTemplate } from "./AdminPermissionsPage";

interface AdminPermissionsFormPageProps {
    id?: string;
    initialData?: Partial<AdminPermissionTemplate>;
}

export function AdminPermissionsFormPage({ id, initialData }: AdminPermissionsFormPageProps) {
    const router = useRouter();
    const isEdit = !!id;

    const [data, setData] = useState<Partial<AdminPermissionTemplate>>({
        name: initialData?.name || "",
        description: initialData?.description || "",
        isActive: initialData?.isActive !== false,
        permissions: initialData?.permissions || []
    });
    const [submitting, setSubmitting] = useState(false);

    useRegisterBreadcrumbs(
        initialData?.name
            ? [
                  {
                      label: initialData.name,
                      href: `/admin/permissions/${id}`
                  }
              ]
            : []
    );

    const fields: FieldConfig<any>[] = [
        {
            name: "name",
            label: m["admin.permissions.form.name"](),
            type: "text",
            required: true,
            gridColumn: "span 12"
        },
        {
            name: "description",
            label: m["admin.permissions.form.description"](),
            type: "textarea",
            rows: 2,
            gridColumn: "span 12"
        },
        {
            name: "permissions",
            label: m["admin.permissions.form.permissions"](),
            type: "permissions",
            gridColumn: "span 12",
            helperText: m["admin.permissions.form.helper_text"]()
        }
    ];

    const handleSubmit = async (formData: any) => {
        setSubmitting(true);
        try {
            let result;
            if (isEdit) {
                result = await api.admin.permissions({ id }).patch(formData);
            } else {
                result = await api.admin.permissions.post(formData);
            }

            const { error } = result;
            if (!error) {
                newSuccessToast(isEdit ? m["admin.permissions.toasts.updated"]() : m["admin.permissions.toasts.created"]());
                router.push("/admin/permissions");
                router.refresh();
            } else {
                newErrorToast(isEdit ? m["admin.permissions.toasts.updateError"]() : m["admin.permissions.toasts.createError"]());
            }
        } catch (e) {
            console.error("Submit error:", e);
            newErrorToast(isEdit ? m["admin.permissions.toasts.updateError"]() : m["admin.permissions.toasts.createError"]());
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container>
            <AdminFormBuilder
                title={isEdit ? `${m["admin.permissions.page.editTitle"]()}: ${initialData?.name}` : m["admin.permissions.page.createTitle"]()}
                id={id}
                resource="admin.permissions"
                action={isEdit ? "update" : "create"}
                fields={fields}
                data={data}
                onChange={setData}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/admin/permissions")}
                submitting={submitting}
                disabled={initialData?.isActive === false}
                submitLabel={m["admin.permissions.form.save"]()}
                cancelLabel={m["admin.permissions.form.cancel"]()}
                savingLabel={m["admin.permissions.form.saving"]()}
            />
        </Container>
    );
}
