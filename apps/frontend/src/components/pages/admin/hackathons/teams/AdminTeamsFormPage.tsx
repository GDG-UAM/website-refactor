"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container } from "#/components/pages/admin/AdminFormPage.styles";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import { AdminTrack } from "../tracks/AdminTracksPage";

export type TeamFormData = {
    name: string;
    hackathonId: string;
    trackId?: string | null;
    projectDescription?: string | null;
    users?: string[];
    isActive?: boolean;
};

interface AdminTeamsFormPageProps {
    hackathonId: string;
    id?: string;
    initialData?: Partial<TeamFormData>;
}

export function AdminTeamsFormPage({ hackathonId, id, initialData }: AdminTeamsFormPageProps) {
    const router = useRouter();
    const [data, setData] = useState<TeamFormData>({
        name: initialData?.name || "",
        hackathonId: hackathonId,
        trackId: initialData?.trackId || "",
        projectDescription: initialData?.projectDescription || "",
        users: initialData?.users || []
    });
    const [tracks, setTracks] = useState<AdminTrack[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const isEdit = !!id;

    const loadTracks = useCallback(async () => {
        try {
            const { data } = await api.admin.hackathons({ id: hackathonId }).tracks.get();
            if (data) setTracks(data.items);
        } catch (e) {
            console.error("Failed to load tracks:", e);
        }
    }, [hackathonId]);

    useEffect(() => {
        loadTracks();
    }, [loadTracks]);

    if (isEdit) {
        useRegisterBreadcrumbs(
            data.name
                ? [
                      {
                          label: data.name,
                          href: `/admin/hackathons/${hackathonId}/teams/${id}`,
                          warning: initialData?.isActive === false ? m["admin.hackathons.teams.deletedWarning"]() : undefined
                      }
                  ]
                : []
        );
    }

    const fields: FieldConfig<TeamFormData>[] = [
        {
            name: "name",
            label: m["admin.hackathons.teams.fields.name"](),
            type: "text",
            required: true,
            gridColumn: "span 8"
        },
        {
            name: "trackId",
            label: m["admin.hackathons.teams.fields.track"](),
            type: "select",
            options: tracks.map((t) => ({ label: t.name, value: t._id })),
            gridColumn: "span 4"
        },
        {
            name: "projectDescription",
            label: m["admin.hackathons.teams.fields.projectDescription"](),
            type: "multiline",
            rows: 4,
            gridColumn: "span 12"
        },
        {
            name: "users",
            label: m["admin.hackathons.teams.fields.members"](),
            type: "user-selector",
            roles: ["user", "team", "organizer"],
            allowRawStrings: true,
            gridColumn: "span 12"
        }
    ];

    const handleSubmit = async (formData: TeamFormData | Partial<TeamFormData>) => {
        setSubmitting(true);
        try {
            let result;
            if (isEdit) {
                result = await api.admin.teams({ id }).patch(formData);
            } else {
                result = await api.admin.teams.post(formData as any);
            }

            const { error } = result;
            if (!error) {
                newSuccessToast(isEdit ? m["admin.hackathons.teams.toasts.updated"]() : m["admin.hackathons.teams.toasts.created"]());
                router.push(`/admin/hackathons/${hackathonId}/teams`);
                router.refresh();
            } else {
                const errorMsg = typeof error.value === "object" && "error" in error.value ? error.value.error : "Error";
                newErrorToast(errorMsg || (isEdit ? m["admin.hackathons.teams.toasts.updateError"]() : m["admin.hackathons.teams.toasts.createError"]()));
            }
        } catch (e) {
            console.error("Submit error:", e);
            newErrorToast(isEdit ? m["admin.hackathons.teams.toasts.updateError"]() : m["admin.hackathons.teams.toasts.createError"]());
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container>
            <AdminFormBuilder
                title={isEdit ? m["admin.hackathons.teams.page.editTitle"]() : m["admin.hackathons.teams.page.createTitle"]()}
                id={id}
                resource={`admin.hackathons.${hackathonId}.teams`}
                action={isEdit ? "update" : "create"}
                fields={fields}
                data={data}
                onChange={setData}
                onSubmit={handleSubmit}
                onCancel={() => router.push(`/admin/hackathons/${hackathonId}/teams`)}
                submitting={submitting}
                disabled={initialData?.isActive === false}
                submitLabel={m["admin.hackathons.teams.form.save"]()}
                cancelLabel={m["admin.hackathons.teams.form.cancel"]()}
                savingLabel={m["admin.hackathons.teams.form.saving"]()}
            />
        </Container>
    );
}
