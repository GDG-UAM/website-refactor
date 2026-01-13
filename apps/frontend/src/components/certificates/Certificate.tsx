import { getDesignById } from "./CertificateDesigns";
import { CertificateData } from "./types";

export interface CertificateProps {
    data: CertificateData;
}

export default function Certificate({ data }: CertificateProps) {
    const DesignComponent = getDesignById(data.designId).component;
    return <DesignComponent data={data} />;
}

export type { CertificateData };
