"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container } from "#/components/pages/admin/AdminFormPage.styles";
import { PermissionedIntermissionData } from "./IntermissionForm.types";

interface AdminIntermissionFormPageProps {
    id: string;
    initialData: any;
}

export function AdminIntermissionFormPage({ id, initialData }: AdminIntermissionFormPageProps) {
    const router = useRouter();
    const [data, setData] = useState<PermissionedIntermissionData>({
        "intermission.schedule": initialData?.intermission?.schedule ?? [],
        "intermission.sponsors": initialData?.intermission?.sponsors ?? [],
        "intermission.carousel": initialData?.intermission?.carousel ?? [],
        "intermission.organizerLogoUrl": initialData?.intermission?.organizerLogoUrl ?? ""
    });
    const [submitting, setSubmitting] = useState(false);

    const fields: FieldConfig<PermissionedIntermissionData>[] = [
        {
            name: "intermission.organizerLogoUrl",
            label: m["admin.hackathons.intermission.fields.organizerLogoUrl"](),
            type: "text",
            helperText: m["admin.hackathons.intermission.helpers.organizerLogo"](),
            gridColumn: "span 12"
        },
        {
            name: "intermission.schedule",
            label: m["admin.hackathons.intermission.sections.schedule"](),
            type: "schedule",
            gridColumn: "span 12"
        },
        {
            name: "intermission.carousel",
            label: m["admin.hackathons.intermission.sections.carousel"](),
            type: "carousel",
            gridColumn: "span 12"
        },
        {
            name: "intermission.sponsors",
            label: m["admin.hackathons.intermission.sections.sponsors"](),
            type: "sponsors",
            gridColumn: "span 12"
        }
    ];

    const handleSubmit = async (formData: PermissionedIntermissionData) => {
        setSubmitting(true);
        try {
            const { error } = await api.admin.hackathons({ id }).patch({
                intermission: Object.fromEntries(
                    Object.entries(formData)
                        .filter(([key]) => key.startsWith("intermission."))
                        .map(([key, value]) => [key.replace("intermission.", ""), value])
                )
            } as any);

            if (!error) {
                newSuccessToast(m["admin.hackathons.toasts.updated"]());
                router.refresh();
            } else {
                newErrorToast(m["admin.hackathons.toasts.updateError"]());
            }
        } catch (e) {
            console.error("Submit error:", e);
            newErrorToast(m["admin.hackathons.toasts.updateError"]());
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container>
            <AdminFormBuilder
                title={m["admin.hackathons.intermission.sections.general"]()}
                id={id}
                resource="admin.hackathons"
                action="update"
                fields={fields}
                data={data}
                onChange={setData}
                onSubmit={handleSubmit}
                onCancel={() => router.push(`/admin/hackathons/${id}`)}
                submitting={submitting}
                disabled={initialData?.isActive === false}
                submitLabel={m["buttons.save"]()}
                cancelLabel={m["buttons.cancel"]()}
                savingLabel={m["admin.hackathons.form.saving"]()}
            />
        </Container>
    );
}
