import { api } from "#/lib/eden";
import { buildSectionMetadata } from "#/lib/metadata";
import { notFound } from "next/navigation";
import CertificateView from "#/components/certificates/CertificateView";
import type { CertificateData } from "#/components/certificates/types";
import { Metadata } from "next";

export const revalidate = 60;

function isValidId(id: string) {
    return /^[a-f0-9]{24}$/.test(id);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    if (!isValidId(id)) return buildSectionMetadata("certificates");

    const { data: certificate } = await api.certificates({ id }).get();
    if (!certificate) return buildSectionMetadata("certificates");

    const entityName = ("title" in certificate && certificate.title) || "Certificate";
    const description = `Certificate for ${("recipient" in certificate && certificate.recipient.name) || ""}`;
    return buildSectionMetadata("certificates", entityName, description);
}

export default async function CertificatePublicPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!isValidId(id)) {
        notFound();
    }

    const { data: certificate, error } = await api.certificates({ id }).get();
    if (error || !certificate) {
        notFound();
    }

    // Transform the certificate data for the view component
    const certificateData: CertificateData = {
        title: certificate.title,
        description: certificate.description ?? undefined,
        type: certificate.type as any,
        recipient: {
            name: certificate.recipient.name,
            userId: certificate.recipient.userId ?? undefined
        },
        designId: certificate.designId,
        period:
            certificate.startDate || certificate.endDate
                ? {
                      startDate: certificate.startDate
                          ? isNaN(new Date(certificate.startDate).getTime())
                              ? undefined
                              : new Date(certificate.startDate).toISOString()
                          : undefined,
                      endDate: certificate.endDate
                          ? isNaN(new Date(certificate.endDate).getTime())
                              ? undefined
                              : new Date(certificate.endDate).toISOString()
                          : undefined
                  }
                : undefined,
        signatures: certificate.signatures as any,
        metadata: certificate.metadata as any
    };

    const isRevoked = certificate.revoked || false;
    const createdAt = certificate.createdAt ? new Date(certificate.createdAt) : undefined;
    const recipientUserId = certificate.recipient.userId;

    return (
        <main
            style={{
                padding: "40px 32px 80px",
                maxWidth: "min(900px, calc(100vw - 76px))",
                width: "100%",
                margin: "0 auto"
            }}
        >
            <CertificateView
                data={certificateData}
                id={certificate._id}
                isRevoked={isRevoked}
                createdAt={createdAt}
                recipientUserId={recipientUserId}
                showVerification
            />
        </main>
    );
}
