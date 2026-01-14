// import * as SibApiV3Sdk from "@getbrevo/brevo";

// export type ContactPayload = {
//     type: "personal" | "sponsor";
//     name: string;
//     email: string;
//     message: string;
//     orgName?: string;
//     website?: string;
// };

// const defaultClient = new SibApiV3Sdk.TransactionalEmailsApi();
// defaultClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_KEY || "");

// export async function sendContactEmail(payload: ContactPayload) {
//     const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

//     sendSmtpEmail.templateId = payload.type === "personal" ? 2 : 3;
//     sendSmtpEmail.to = [
//         {
//             email: process.env.ASSOCIATION_EMAIL || "gdguam@gmail.com",
//             name: "GDGoC UAM Website"
//         }
//     ];
//     sendSmtpEmail.replyTo = { email: payload.email, name: payload.name };
//     sendSmtpEmail.params = {
//         CONTACT_NAME: payload.name,
//         CONTACT_EMAIL: payload.email,
//         CONTENT: payload.message,
//         CONTACT_ORG_NAME: payload.orgName,
//         CONTACT_WEBSITE: payload.website
//     };

//     // May throw an error, which will be handled by the route
//     await defaultClient.sendTransacEmail(sendSmtpEmail);
// }
