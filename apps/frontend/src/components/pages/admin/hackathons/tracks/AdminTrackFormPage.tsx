"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container } from "#/components/pages/admin/AdminFormPage.styles";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import { AdminHackathon } from "../AdminHackathonsPage";

interface AdminTrackFormPageProps {
    hackathonId: string;
    trackId?: string;
    initialData?: any;
    hackathon?: AdminHackathon;
}

interface RubricItem {
    name: string;
    weight: number;
}

interface TrackFormData {
    name: string;
    judges: string[];
    rubric: RubricItem[];
}

export function AdminTrackFormPage({ hackathonId, trackId, initialData, hackathon }: AdminTrackFormPageProps) {
    const router = useRouter();
    const [data, setData] = useState<TrackFormData>({
        name: initialData?.name ?? "",
        judges: initialData?.judges ?? [],
        rubric: initialData?.rubric ?? []
    });
    const [submitting, setSubmitting] = useState(false);

    const isCreate = !trackId;
    const resourceBase = `admin.hackathons.${hackathonId}.tracks`;
    const resource = isCreate ? resourceBase : `${resourceBase}.${trackId}`;
    const isEdit = !!trackId;

    if (isEdit) {
        useRegisterBreadcrumbs(
            data.name
                ? [
                      {
                          label: data.name,
                          href: `/admin/hackathons/${hackathonId}/tracks/${trackId}`,
                          warning: initialData?.isActive === false ? m["admin.hackathons.tracks.deletedWarning"]() : undefined
                      }
                  ]
                : []
        );
    }

    const fields: FieldConfig<TrackFormData>[] = [
        {
            name: "name",
            label: m["admin.hackathons.tracks.fields.name"](),
            type: "text",
            required: true,
            gridColumn: "span 12"
        },
        {
            name: "judges",
            label: m["admin.hackathons.tracks.fields.judges"](),
            type: "user-selector",
            required: true,
            roles: ["user", "team", "organizer"],
            gridColumn: "span 12"
        },
        {
            name: "rubric",
            label: m["admin.hackathons.tracks.sections.rubric"](),
            type: "table",
            gridColumn: "span 12",
            addButtonLabel: m["admin.hackathons.tracks.actions.addCriterion"](),
            emptyMessage: "No criteria defined.",
            columns: [
                {
                    name: "name",
                    label: m["admin.hackathons.tracks.fields.rubricName"](),
                    type: "text",
                    required: true
                },
                {
                    name: "weight",
                    label: m["admin.hackathons.tracks.fields.rubricWeight"](),
                    type: "number",
                    required: true,
                    width: "120px"
                }
            ],
            validate: (val: RubricItem[]) => {
                const invalid = val.some((row) => !row.name || row.weight === undefined || row.weight < 0);
                return invalid ? m["admin.hackathons.tracks.fields.errors.rubricMissing"]() : true;
            }
        }
    ];

    const handleSubmit = async (formData: TrackFormData) => {
        setSubmitting(true);
        try {
            if (isCreate) {
                const { error } = await api.admin.hackathons({ id: hackathonId }).tracks.post(formData);
                if (!error) {
                    newSuccessToast(m["admin.hackathons.tracks.toasts.created"]());
                    router.push(`/admin/hackathons/${hackathonId}/tracks`);
                } else {
                    throw new Error("Failed to create track");
                }
            } else {
                const { error } = await api.admin.hackathons({ id: hackathonId }).tracks({ trackId }).patch(formData);
                if (!error) {
                    newSuccessToast(m["admin.hackathons.tracks.toasts.updated"]());
                    router.refresh();
                } else {
                    throw new Error("Failed to update track");
                }
            }
        } catch (e) {
            console.error("Submit error:", e);
            newErrorToast(m["admin.hackathons.tracks.toasts.error"]());
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container>
            <AdminFormBuilder
                title={isCreate ? m["admin.hackathons.tracks.actions.createTrack"]() : m["admin.hackathons.tracks.actions.editTrack"]()}
                id={trackId || "create"}
                resource={resource}
                action={isCreate ? "create" : "update"}
                fields={fields}
                data={data}
                onChange={setData}
                onSubmit={handleSubmit}
                onCancel={() => router.push(`/admin/hackathons/${hackathonId}/tracks`)}
                submitting={submitting}
                disabled={(!isCreate && initialData?.isActive === false) || hackathon?.isActive === false}
                submitLabel={m["buttons.save"]()}
                cancelLabel={m["buttons.cancel"]()}
                savingLabel={m["admin.hackathons.form.saving"]()}
            />
        </Container>
    );
}
