import DefaultCertificate from "./DefaultCertificate";
import CEUAMCertificate from "./CEUAMCertificate";
import * as m from "#/paraglide/messages";

export const CERTIFICATE_DESIGNS = [
    {
        id: 0,
        name: "Default Design",
        component: DefaultCertificate,
        previewImage: "/images/certificates/default-preview.png"
    },
    {
        id: 1,
        name: "CEUAM Design",
        component: CEUAMCertificate,
        previewImage: "/images/certificates/ceuam-preview.png"
    }
];

export const getDesignById = (id: number) => {
    return CERTIFICATE_DESIGNS.find((d) => d.id === id) || CERTIFICATE_DESIGNS[0];
};

export const getDesignOptions = () => {
    return CERTIFICATE_DESIGNS.map((d) => ({
        label: d.name,
        value: d.id,
        icon: d.previewImage
    }));
};
