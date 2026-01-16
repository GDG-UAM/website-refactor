"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import { Container } from "#/components/pages/admin/AdminFormPage.styles";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import * as m from "#/paraglide/messages";
import { AdminUser } from "./AdminUsersPage";

interface AdminUsersFormPageProps {
    id: string;
    initialData?: Partial<AdminUser>;
}

export function AdminUsersFormPage({ id, initialData }: AdminUsersFormPageProps) {
    const router = useRouter();
    const [data, setData] = useState<Partial<AdminUser>>({
        name: initialData?.name || "",
        email: initialData?.email || "",
        role: initialData?.role || "user",
        templatesUsed: initialData?.templatesUsed || [],
        individualPermissions: initialData?.individualPermissions || []
    });
    const [templates, setTemplates] = useState<{ label: string; value: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useRegisterBreadcrumbs(
        initialData?.name
            ? [
                  {
                      label: initialData.name,
                      href: `/admin/users/${id}`
                  }
              ]
            : []
    );

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const { data: tData } = await api.admin.permissions.get();
                if (tData) {
                    setTemplates(tData.filter((t) => !t.name.startsWith("role:")).map((t) => ({ label: t.name, value: t._id })));
                }
            } catch (e) {
                console.error("Failed to load templates", e);
            }
        };
        loadTemplates();
    }, []);

    const fields: FieldConfig<any>[] = [
        {
            name: "role",
            label: m["admin.users.form.role"](),
            type: "select",
            options: [
                { label: "User", value: "user" },
                { label: "Team", value: "team" },
                { label: "Organizer", value: "organizer" }
            ],
            required: true,
            gridColumn: "span 12"
        },
        {
            name: "templatesUsed",
            label: m["admin.users.form.templates"](),
            type: "multiselect",
            options: templates,
            gridColumn: "span 12",
            placeholder: "Search and select templates..."
        },
        {
            name: "individualPermissions",
            label: m["admin.users.form.individualPermissions"](),
            type: "permissions",
            gridColumn: "span 12"
        }
    ];

    const handleSubmit = async (formData: any) => {
        setSubmitting(true);
        try {
            const { error } = await api.admin.users({ id }).patch(formData);

            if (!error) {
                newSuccessToast(m["admin.users.toasts.updated"]());
                router.push("/admin/users");
                router.refresh();
            } else {
                newErrorToast(m["admin.users.toasts.updateError"]());
            }
        } catch (e) {
            console.error("Submit error:", e);
            newErrorToast(m["admin.users.toasts.updateError"]());
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container>
            <AdminFormBuilder
                title={`${m["admin.users.page.editTitle"]()}: ${initialData?.name || id}`}
                id={id}
                resource="admin.users"
                action="update"
                fields={fields}
                data={data}
                onChange={setData}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/admin/users")}
                submitting={submitting}
                submitLabel={m["admin.users.form.save"]()}
                cancelLabel={m["admin.users.form.cancel"]()}
                savingLabel={m["admin.users.form.saving"]()}
            />
        </Container>
    );
}
