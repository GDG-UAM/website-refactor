"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container } from "#/components/pages/admin/AdminFormPage.styles";
import { IntermissionData } from "./IntermissionForm.types";

interface AdminIntermissionFormPageProps {
    id: string;
    initialData: any;
}

export function AdminIntermissionFormPage({ id, initialData }: AdminIntermissionFormPageProps) {
    const router = useRouter();
    const [data, setData] = useState<IntermissionData>({
        schedule: initialData?.intermission?.schedule ?? [],
        sponsors: initialData?.intermission?.sponsors ?? [],
        carousel: initialData?.intermission?.carousel ?? [],
        organizerLogoUrl: initialData?.intermission?.organizerLogoUrl ?? ""
    });
    const [submitting, setSubmitting] = useState(false);

    const fields: FieldConfig<IntermissionData>[] = [
        {
            name: "organizerLogoUrl",
            label: m["admin.hackathons.intermission.fields.organizerLogoUrl"](),
            type: "text",
            helperText: m["admin.hackathons.intermission.helpers.organizerLogo"](),
            gridColumn: "span 12"
        },
        {
            name: "schedule",
            label: m["admin.hackathons.intermission.sections.schedule"](),
            type: "table",
            gridColumn: "span 12",
            addButtonLabel: m["admin.hackathons.intermission.actions.addActivity"](),
            emptyMessage: m["admin.hackathons.intermission.helpers.noSchedule"](),
            columns: [
                {
                    name: "startTime",
                    label: m["admin.hackathons.intermission.fields.startTime"](),
                    type: "time",
                    width: "140px",
                    required: true
                },
                {
                    name: "endTime",
                    label: m["admin.hackathons.intermission.fields.endTime"](),
                    type: "time",
                    width: "140px"
                },
                {
                    name: "title",
                    label: m["admin.hackathons.intermission.fields.title"](),
                    type: "text",
                    required: true,
                    placeholder: m["admin.hackathons.intermission.fields.title"]()
                }
            ],
            validate: (val: any[]) => {
                const invalid = val.some((row) => !row.startTime || !row.title);
                return invalid ? m["admin.hackathons.intermission.fields.errors.scheduleMissing"]() : true;
            }
        },
        {
            name: "carousel",
            label: m["admin.hackathons.intermission.sections.carousel"](),
            type: "carousel",
            gridColumn: "span 12"
        },
        {
            name: "sponsors",
            label: m["admin.hackathons.intermission.sections.sponsors"](),
            type: "table",
            gridColumn: "span 12",
            addButtonLabel: m["admin.hackathons.intermission.actions.addSponsor"](),
            emptyMessage: m["admin.hackathons.intermission.helpers.noSponsors"](),
            columns: [
                {
                    name: "name",
                    label: m["admin.hackathons.intermission.fields.sponsorName"](),
                    type: "text",
                    required: true,
                    placeholder: m["admin.hackathons.intermission.fields.sponsorName"]()
                },
                {
                    name: "logoUrl",
                    label: m["admin.hackathons.intermission.fields.logoUrl"](),
                    type: "text",
                    required: true,
                    placeholder: "https://..."
                },
                {
                    name: "tier",
                    label: m["admin.hackathons.intermission.fields.tier"](),
                    type: "number",
                    width: "120px",
                    required: true
                }
            ],
            validate: (val: any[]) => {
                const invalid = val.some((row) => !row.name || !row.logoUrl || typeof row.tier !== "number");
                return invalid ? m["admin.hackathons.intermission.fields.errors.sponsorMissing"]() : true;
            }
        }
    ];

    const handleSubmit = async (formData: IntermissionData) => {
        setSubmitting(true);
        try {
            const { error } = await api.admin.hackathons({ id }).patch({
                intermission: formData
            });

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
                resource={`admin.hackathons.${id}.intermission`}
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
