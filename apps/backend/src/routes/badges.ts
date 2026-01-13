import { Elysia } from "elysia";
import db from "../lib/db";
import crypto from "node:crypto";

const BASE_URL = process.env.BASE_URL || "https://gdguam.es";

export const badgesRoutes = new Elysia({ prefix: "/badges" })
    .get(
        "/issuer",
        () => {
            return {
                "@context": "https://w3id.org/openbadges/v2",
                type: "Issuer",
                id: `${BASE_URL}/api/badges/issuer`,
                name: "Google Developer Group on Campus - Universidad Autónoma de Madrid",
                url: BASE_URL,
                image: `${BASE_URL}/logo/logo.svg`,
                email: "gdguam@gmail.com"
            };
        },
        {
            detail: {
                tags: ["Badges"]
            }
        }
    )

    .get(
        "/class/:id",
        async ({ params: { id }, set }) => {
            try {
                const { certificateRepository } = db.getRepositories();
                const certificate = await certificateRepository.findById(id);

                if (!certificate || certificate.revoked) {
                    set.status = 404;
                    return { error: "Certificate not found or revoked" };
                }

                return {
                    "@context": "https://w3id.org/openbadges/v2",
                    type: "BadgeClass",
                    id: `${BASE_URL}/api/badges/class/${id}`,
                    name: certificate.title,
                    description: certificate.description || certificate.title,
                    criteria: {
                        narrative: `Certificate awarded to ${certificate.recipient.name} for ${certificate.title}.`
                    },
                    issuer: `${BASE_URL}/api/badges/issuer`,
                    image: `${BASE_URL}/logo/logo.svg`
                };
            } catch (e) {
                set.status = 500;
                return { error: "Internal server error" };
            }
        },
        {
            detail: {
                tags: ["Badges"]
            }
        }
    )

    .get(
        "/assertion/:id",
        async ({ params: { id }, set }) => {
            try {
                const { certificateRepository, userRepository } = db.getRepositories();
                const certificate = await certificateRepository.findById(id);

                if (!certificate || certificate.revoked) {
                    set.status = 404;
                    return { error: "Certificate not found or revoked" };
                }

                if (!certificate.recipient.userId) {
                    set.status = 400;
                    return { error: "Certificate recipient has no associated user account" };
                }

                const user = await userRepository.findById(certificate.recipient.userId);
                if (!user || !user.email) {
                    set.status = 404;
                    return { error: "User not found" };
                }

                const hash = crypto.createHash("sha256").update(user.email).digest("hex");

                return {
                    "@context": "https://w3id.org/openbadges/v2",
                    type: "Assertion",
                    id: `${BASE_URL}/api/badges/assertion/${id}`,
                    recipient: {
                        type: "email",
                        hashed: true,
                        identity: `sha256$${hash}`
                    },
                    issuedOn: new Date(certificate.createdAt).toISOString(),
                    verification: {
                        type: "HostedBadge"
                    },
                    badge: `${BASE_URL}/api/badges/class/${id}`
                };
            } catch (e) {
                console.error(e);
                set.status = 500;
                return { error: "Internal server error" };
            }
        },
        {
            detail: {
                tags: ["Badges"]
            }
        }
    );
