"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container } from "#/components/pages/admin/AdminFormPage.styles";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import { getDesignOptions } from "#/components/certificates/CertificateDesigns";

const TYPE_ORDER = ["PARTICIPATION", "COURSE_COMPLETION", "EVENT_ACHIEVEMENT", "VOLUNTEER"];

interface TeamCertificateTemplateFormPageProps {
    hackathonId: string;
    teamId: string;
    templateId?: string;
    hackathon: any;
    team: any;
    initialData?: any;
}

type CertificateType = "PARTICIPATION" | "COURSE_COMPLETION" | "EVENT_ACHIEVEMENT" | "VOLUNTEER";

interface TemplateFormData {
    title: string;
    designId: number;
    type: CertificateType;
    description: string;
    startDate: string;
    endDate: string;
    recipients: string;
    signatures: { name: string; role: string; imageUrl: string }[];
    // Metadata fields
    "metadata.hours"?: number;
    "metadata.grade"?: string;
    "metadata.rank"?: string;
    "metadata.group"?: string;
    "metadata.role"?: string;
}

export function TeamCertificateTemplateFormPage({ hackathonId, teamId, templateId, hackathon, team, initialData }: TeamCertificateTemplateFormPageProps) {
    const router = useRouter();
    const isEdit = !!templateId;
    const baseUrl = `/admin/hackathons/${hackathonId}/teams/${teamId}/certificates`;

    // Default signatures from hackathon
    const defaultSignatures = hackathon?.certificateDefaults?.signatures || [];

    // Get inherited values from hackathon
    const inheritedTitle = hackathon?.certificateDefaults?.title || hackathon?.title || "";
    const inheritedDesignId = hackathon?.certificateDefaults?.designId ?? 0;
    const inheritedStartDate = hackathon?.date ? new Date(hackathon.date).toISOString().split("T")[0] : "";
    const inheritedEndDate = hackathon?.endDate ? new Date(hackathon.endDate).toISOString().split("T")[0] : "";

    // Get recipients list from team (display only)
    const teamRecipients = (team.users || []).join(", ");

    const [data, setData] = useState<TemplateFormData>(() => {
        const base: TemplateFormData = {
            title: inheritedTitle,
            designId: inheritedDesignId,
            type: initialData?.type || "PARTICIPATION",
            description: initialData?.description || "",
            startDate: inheritedStartDate,
            endDate: inheritedEndDate,
            recipients: teamRecipients || "No team members",
            signatures: initialData?.signatures || defaultSignatures
        };

        // Flatten metadata for form fields
        if (initialData?.metadata && typeof initialData.metadata === "object") {
            Object.entries(initialData.metadata).forEach(([key, val]) => {
                (base as any)[`metadata.${key}`] = val;
            });
        }

        // For EVENT_ACHIEVEMENT, pre-fill group with team name
        if (base.type === "EVENT_ACHIEVEMENT" && !initialData?.metadata?.group) {
            base["metadata.group"] = team.name;
        }

        return base;
    });
    const [submitting, setSubmitting] = useState(false);

    const [direction, setDirection] = useState(0);

    const handleChange = (newData: TemplateFormData) => {
        if (newData.type !== data.type) {
            const prevIndex = TYPE_ORDER.indexOf(data.type);
            const currIndex = TYPE_ORDER.indexOf(newData.type);
            setDirection(currIndex > prevIndex ? 1 : -1);
        }
        setData(newData);
    };

    if (isEdit && initialData) {
        useRegisterBreadcrumbs([
            {
                label: m[`admin.certificates.types.${initialData.type as CertificateType}`](),
                href: `${baseUrl}/${templateId}`,
                warning: !initialData.isActive ? m["admin.hackathons.teams.certificates.deletedWarning"]() : undefined
            }
        ]);
    }

    const getExtraFields = (): FieldConfig<TemplateFormData>[] => {
        const extra: FieldConfig<TemplateFormData>[] = [];

        if (data.type === "COURSE_COMPLETION") {
            extra.push(
                { name: "metadata.hours", label: m["admin.certificates.form.hours"](), type: "number", gridColumn: "span 6" },
                { name: "metadata.grade", label: m["admin.certificates.form.grade"](), type: "text", gridColumn: "span 6" }
            );
        } else if (data.type === "EVENT_ACHIEVEMENT") {
            extra.push(
                { name: "metadata.rank", label: m["admin.certificates.form.rank"](), type: "text", gridColumn: "span 6" },
                {
                    name: "metadata.group",
                    label: m["admin.certificates.form.group"](),
                    type: "text",
                    gridColumn: "span 6",
                    disabled: true,
                    helperText: m["admin.hackathons.teams.certificates.helpers.inheritedFromTeam"]()
                }
            );
        } else if (data.type === "PARTICIPATION") {
            extra.push({
                name: "metadata.role",
                label: m["admin.certificates.form.role"](),
                type: "select",
                gridColumn: "span 12",
                options: [
                    { label: m["admin.certificates.form.roles.ATTENDEE"](), value: "ATTENDEE" },
                    { label: m["admin.certificates.form.roles.PARTICIPANT"](), value: "PARTICIPANT" },
                    { label: m["admin.certificates.form.roles.SPEAKER"](), value: "SPEAKER" },
                    { label: m["admin.certificates.form.roles.ORGANIZER"](), value: "ORGANIZER" }
                ]
            });
        } else if (data.type === "VOLUNTEER") {
            extra.push({ name: "metadata.hours", label: m["admin.certificates.form.hours"](), type: "number", gridColumn: "span 12" });
        }

        return extra;
    };

    const fields: FieldConfig<TemplateFormData>[] = [
        // Inherited fields (disabled)
        // {
        //     name: "title",
        //     label: m["admin.certificates.form.title"](),
        //     type: "text",
        //     gridColumn: "span 8",
        //     disabled: true,
        //     helperText: m["admin.hackathons.teams.certificates.helpers.inheritedFromHackathon"]()
        // },
        // {
        //     name: "designId",
        //     label: m["admin.certificates.form.designId"](),
        //     type: "select",
        //     gridColumn: "span 4",
        //     disabled: true,
        //     options: getDesignOptions(),
        //     helperText: m["admin.hackathons.teams.certificates.helpers.inheritedFromHackathon"]()
        // },
        // Description (editable)
        {
            name: "description",
            label: m["admin.certificates.form.description"](),
            type: "multiline",
            gridColumn: "span 12"
        },
        // Inherited dates (disabled)
        // {
        //     name: "startDate",
        //     label: m["admin.certificates.form.startDate"](),
        //     type: "date",
        //     gridColumn: "span 6",
        //     disabled: true,
        //     helperText: m["admin.hackathons.teams.certificates.helpers.inheritedFromHackathon"]()
        // },
        // {
        //     name: "endDate",
        //     label: m["admin.certificates.form.endDate"](),
        //     type: "date",
        //     gridColumn: "span 6",
        //     disabled: true,
        //     helperText: m["admin.hackathons.teams.certificates.helpers.inheritedFromHackathon"]()
        // },
        // // Recipients (display only)
        // {
        //     name: "recipients",
        //     label: m["admin.certificates.form.recipients"](),
        //     type: "text",
        //     gridColumn: "span 12",
        //     disabled: true,
        //     helperText: m["admin.hackathons.teams.certificates.helpers.inheritedFromTeam"]()
        // },
        // Type selection (editable)
        {
            name: "type",
            label: m["admin.certificates.form.type"](),
            type: "choice",
            required: true,
            gridColumn: "span 12",
            options: [
                { label: m["admin.certificates.types.PARTICIPATION"](), value: "PARTICIPATION" },
                { label: m["admin.certificates.types.COURSE_COMPLETION"](), value: "COURSE_COMPLETION" },
                { label: m["admin.certificates.types.EVENT_ACHIEVEMENT"](), value: "EVENT_ACHIEVEMENT" },
                { label: m["admin.certificates.types.VOLUNTEER"](), value: "VOLUNTEER" }
            ]
        },
        // Type-specific metadata fields
        {
            name: "dynamicFields" as any,
            label: "",
            type: "group",
            gridColumn: "span 12",
            animated: true,
            animationKey: data.type,
            animationDirection: direction,
            fields: getExtraFields()
        },
        // Signatures (editable, per user request)
        {
            name: "signatures",
            label: m["admin.certificates.form.signatures"](),
            type: "table",
            gridColumn: "span 12",
            columns: [
                { name: "name", label: "Name", type: "text", required: true },
                { name: "role", label: "Role", type: "text", required: true },
                { name: "imageUrl", label: "Image URL", type: "text", required: true }
            ],
            addButtonLabel: m["admin.hackathons.certificates.actions.addSignature"]()
        }
    ];

    const handleSubmit = async (formData: TemplateFormData) => {
        setSubmitting(true);
        try {
            // Build metadata object from flattened fields
            const metadata: any = {};
            Object.keys(formData).forEach((key) => {
                if (key.startsWith("metadata.")) {
                    const subKey = key.split(".")[1];
                    metadata[subKey] = (formData as any)[key];
                }
            });

            // For EVENT_ACHIEVEMENT, always set group to team name
            if (formData.type === "EVENT_ACHIEVEMENT") {
                metadata.group = team.name;
            }

            const payload = {
                type: formData.type as CertificateType,
                description: formData.description,
                signatures: formData.signatures,
                metadata,
                hackathonId,
                teamId
            };

            let result;
            if (isEdit) {
                result = await api.admin.certificates.templates({ id: templateId! }).patch(payload as any);
            } else {
                result = await api.admin.certificates.templates.post(payload as any);
            }

            if (!result.error) {
                newSuccessToast(isEdit ? m["admin.hackathons.teams.certificates.toasts.updated"]() : m["admin.hackathons.teams.certificates.toasts.created"]());
                router.push(baseUrl);
            } else {
                newErrorToast(m["admin.hackathons.teams.certificates.toasts.error"]());
            }
        } catch (e) {
            console.error("Submit error:", e);
            newErrorToast(m["admin.hackathons.teams.certificates.toasts.error"]());
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container>
            <AdminFormBuilder
                title={isEdit ? m["admin.hackathons.teams.certificates.page.editTitle"]() : m["admin.hackathons.teams.certificates.page.createTitle"]()}
                id={templateId}
                resource="admin.certificates.templates"
                action={isEdit ? "update" : "create"}
                fields={fields}
                data={data}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={() => router.push(baseUrl)}
                submitting={submitting}
                disabled={initialData?.isActive === false || hackathon?.isActive === false || team?.isActive === false}
                submitLabel={m["admin.hackathons.teams.certificates.form.save"]()}
                cancelLabel={m["admin.hackathons.teams.certificates.form.cancel"]()}
                savingLabel={m["admin.hackathons.teams.certificates.form.saving"]()}
            />
        </Container>
    );
}
