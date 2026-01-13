"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminFormBuilder, FieldConfig } from "#/components/pages/admin/AdminFormBuilder";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container } from "#/components/pages/admin/AdminFormPage.styles";

import { getDesignOptions } from "#/components/certificates/CertificateDesigns";

interface AdminCertificatesFormPageProps {
    id: string;
    initialData: any;
}

interface SignatureEntry {
    name: string;
    role: string;
    imageUrl: string;
}

interface CertificatesData {
    title: string;
    designId: number;
    signatures: SignatureEntry[];
}

export function AdminCertificatesFormPage({ id, initialData }: AdminCertificatesFormPageProps) {
    const router = useRouter();
    const [data, setData] = useState<CertificatesData>({
        title: initialData?.certificateDefaults?.title || "",
        designId: initialData?.certificateDefaults?.designId ?? 0,
        signatures: initialData?.certificateDefaults?.signatures || []
    });
    const [submitting, setSubmitting] = useState(false);

    const fields: FieldConfig<CertificatesData>[] = [
        {
            name: "title",
            label: m["admin.hackathons.certificates.fields.title"](),
            type: "text",
            placeholder: initialData.title,
            helperText: m["admin.hackathons.certificates.helpers.titleOverride"]({ name: initialData.title }),
            gridColumn: "span 8"
        },
        {
            name: "designId",
            label: m["admin.hackathons.certificates.fields.designId"](),
            type: "select",
            gridColumn: "span 4",
            options: getDesignOptions()
        },
        {
            name: "signatures",
            label: m["admin.hackathons.certificates.sections.signatures"](),
            type: "table",
            gridColumn: "span 12",
            addButtonLabel: m["admin.hackathons.certificates.actions.addSignature"](),
            emptyMessage: "No default signatures defined.",
            columns: [
                {
                    name: "name",
                    label: m["admin.hackathons.certificates.fields.signatureName"](),
                    type: "text",
                    required: true
                },
                {
                    name: "role",
                    label: m["admin.hackathons.certificates.fields.signatureRole"](),
                    type: "text",
                    required: true
                },
                {
                    name: "imageUrl",
                    label: m["admin.hackathons.certificates.fields.signatureImageUrl"](),
                    type: "text",
                    required: true,
                    placeholder: "https://..."
                }
            ],
            validate: (val: SignatureEntry[]) => {
                const invalid = val.some((row) => !row.name || !row.role || !row.imageUrl);
                return invalid ? m["admin.hackathons.certificates.fields.errors.signatureMissing"]() : true;
            }
        }
    ];

    const handleSubmit = async (formData: CertificatesData) => {
        setSubmitting(true);
        try {
            const { error } = await api.admin.hackathons({ id }).patch({
                certificateDefaults: formData
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
                title={m["admin.hackathons.certificates.sections.general"]()}
                id={id}
                resource={`admin.hackathons.${id}.certificateDefaults`}
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
