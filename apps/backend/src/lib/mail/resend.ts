import { Resend } from "resend";

export type ContactPayload = {
    type: "personal" | "sponsor";
    name: string;
    email: string;
    message: string;
    orgName?: string;
    website?: string;
};

const resend = new Resend(process.env.RESEND_KEY || "");

export function sendContactEmail(payload: ContactPayload) {
    resend.emails.send({
        template: {
            id: `web-contact-${payload.type}`,
            variables: {
                email_type: payload.type.charAt(0).toUpperCase() + payload.type.slice(1),
                sender_name: payload.name,
                sender_email: payload.email,
                content: payload.message.replaceAll("\n", "<br>"),
                org_name: payload.orgName || "",
                website: payload.website || ""
            }
        },
        to: "gdguam@gmail.com",
        replyTo: payload.email
    });
}
