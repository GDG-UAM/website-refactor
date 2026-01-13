export type CertificateType = "COURSE_COMPLETION" | "EVENT_ACHIEVEMENT" | "PARTICIPATION" | "VOLUNTEER";

export interface CertificateSignature {
    name: string;
    role: string;
    imageUrl?: string;
}

export interface CertificateMetadata {
    // Course Completion
    hours?: number;
    grade?: string;
    instructors?: { name: string; ref?: string }[];

    // Event Achievement
    rank?: string;
    group?: string;

    // Participation
    role?: "ATTENDEE" | "PARTICIPANT" | "SPEAKER" | "ORGANIZER";
}

export interface CertificateData {
    recipient: {
        name: string;
        userId?: string;
    };
    type: CertificateType;
    title: string;
    description?: string;
    designId: number;
    period?: {
        startDate?: string;
        endDate?: string;
    };
    signatures: CertificateSignature[];
    metadata?: CertificateMetadata;
}
