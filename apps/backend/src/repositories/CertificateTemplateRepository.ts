import { Collection, ObjectId, type Filter, type Sort } from "mongodb";
import type { CertificateTemplate, CertificateType, Certificate, CertificateSignature } from "./types";
import { CertificateRepository } from "./CertificateRepository";
import { HackathonRepository } from "./HackathonRepository";
import { TeamRepository } from "./TeamRepository";

import { UserRepository } from "./UserRepository";

export type CertificateTemplateInput = {
    recipients?: { name: string; userId?: string }[];
    hackathonId?: string | ObjectId;
    teamId?: string | ObjectId;
    designId: number;
    signatures: CertificateSignature[];
    startDate?: Date | string;
    endDate?: Date | string;
    title: string;
    description?: string;
    type: CertificateType;
    metadata?: any;
    isActive?: boolean;
};

export class CertificateTemplateRepository {
    constructor(
        private collection: Collection<CertificateTemplate>,
        private certificateRepo: CertificateRepository,
        private hackathonRepo: HackathonRepository,
        private teamRepo: TeamRepository,
        private userRepo: UserRepository
    ) {}

    async create(input: CertificateTemplateInput, userId: string): Promise<CertificateTemplate> {
        const now = new Date();
        const template: CertificateTemplate = {
            _id: new ObjectId(),
            recipients: input.recipients || [],
            hackathonId: input.hackathonId ? new ObjectId(input.hackathonId) : undefined,
            teamId: input.teamId ? new ObjectId(input.teamId) : undefined,
            designId: input.designId,
            signatures: input.signatures,
            startDate: input.startDate ? new Date(input.startDate) : undefined,
            endDate: input.endDate ? new Date(input.endDate) : undefined,
            title: input.title,
            description: input.description,
            type: input.type,
            metadata: input.metadata,
            isActive: true,
            createdBy: userId,
            createdAt: now,
            updatedAt: now
        };

        // If linked to entities, resolve initial values
        await this.syncWithEntities(template);

        await this.collection.insertOne(template);
        await this.generateCertificates(template, userId);
        return template;
    }

    async update(id: string, input: Partial<CertificateTemplateInput>, userId: string): Promise<CertificateTemplate | null> {
        const existing = await this.findById(id);
        if (!existing) return null;

        const updates: any = { ...input, updatedAt: new Date() };
        if (input.hackathonId) updates.hackathonId = new ObjectId(input.hackathonId);
        if (input.teamId) updates.teamId = new ObjectId(input.teamId);
        if (input.startDate) updates.startDate = new Date(input.startDate);
        if (input.endDate) updates.endDate = new Date(input.endDate);

        const updated = await this.collection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updates }, { returnDocument: "after" });

        if (updated) {
            await this.syncWithEntities(updated);
            // Re-save if syncWithEntities modified it (e.g. resolved from hackathon)
            await this.collection.updateOne({ _id: updated._id }, { $set: updated });

            await this.generateCertificates(updated, userId);
        }

        return updated;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { isActive: false, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
        if (result) {
            await this.certificateRepo.deleteByTemplateId(result._id, true);
            return true;
        }
        return false;
    }

    async findById(id: string): Promise<CertificateTemplate | null> {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    /**
     * Resolves values from linked hackathon and team
     */
    private async syncWithEntities(template: CertificateTemplate): Promise<void> {
        if (template.hackathonId) {
            const hackathon = await this.hackathonRepo.findById(template.hackathonId.toString(), { includeInactive: true });
            if (hackathon) {
                // DesignId, StartDate, EndDate are locked by hackathon
                template.designId = hackathon.certificateDefaults?.designId ?? template.designId;
                template.startDate = hackathon.date;
                template.endDate = hackathon.endDate || undefined;
                // Title comes from hackathon defaults or hackathon title
                template.title = hackathon.certificateDefaults?.title || hackathon.title;

                // If hackathon is deleted, template should be deleted
                if (!hackathon.isActive) {
                    template.isActive = false;
                }
            }
        }

        if (template.teamId) {
            const team = await this.teamRepo.findById(template.teamId.toString(), { includeInactive: true });
            if (team) {
                const resolvedRecipients = [];
                for (const u of team.users) {
                    if (/^[0-9a-fA-F]{24}$/.test(u)) {
                        const user = await this.userRepo.findById(u);
                        resolvedRecipients.push({
                            name: user?.displayName || user?.name || u,
                            userId: u
                        });
                    } else {
                        resolvedRecipients.push({ name: u });
                    }
                }
                template.recipients = resolvedRecipients;
                // If team is deleted, template should be deleted
                if (!team.isActive) {
                    template.isActive = false;
                }
            }
        }
    }

    /**
     * Generates or updates individual certificates based on template state
     */
    private async generateCertificates(template: CertificateTemplate, userId: string): Promise<void> {
        // 1. Get current certificates for this template
        const { items: existingCerts } = await this.certificateRepo.list({
            templateId: template._id.toString(),
            includeInactive: true,
            pageSize: 1000
        });

        const existingRecipientMap = new Map(existingCerts.map((c) => [c.recipient.userId || c.recipient.name, c]));
        const targetIds = new Set(template.recipients.map((r) => r.userId || r.name));

        // 2. Delete certificates for removed recipients (Physical delete as requested)
        for (const cert of existingCerts) {
            const key = cert.recipient.userId || cert.recipient.name;
            if (!targetIds.has(key)) {
                await this.certificateRepo.delete(cert._id.toString(), false);
            }
        }

        // 3. Update or Create certificates
        for (const recipient of template.recipients) {
            const certData = {
                recipient,
                designId: template.designId,
                signatures: template.signatures,
                startDate: template.startDate,
                endDate: template.endDate,
                title: template.title,
                description: template.description,
                type: template.type,
                metadata: template.metadata,
                templateId: template._id,
                isActive: template.isActive
            };

            const key = recipient.userId || recipient.name;
            const existingCert = existingRecipientMap.get(key);
            if (existingCert) {
                await this.certificateRepo.update(existingCert._id.toString(), certData);
            } else {
                await this.certificateRepo.create(certData, userId);
            }
        }
    }

    async syncTemplatesByHackathon(hackathonId: string): Promise<void> {
        const templates = await this.collection.find({ hackathonId: new ObjectId(hackathonId) }).toArray();
        for (const template of templates) {
            // We need a userId for generation, we'll use the creator of the template or system
            await this.update(template._id.toString(), {}, template.createdBy);
        }
    }

    async syncTemplatesByTeam(teamId: string): Promise<void> {
        const templates = await this.collection.find({ teamId: new ObjectId(teamId) }).toArray();
        for (const template of templates) {
            await this.update(template._id.toString(), {}, template.createdBy);
        }
    }

    async list(params: {
        search?: string;
        page?: number;
        pageSize?: number;
        includeInactive?: boolean;
        teamId?: string;
        hackathonId?: string;
    }): Promise<{ items: CertificateTemplate[]; total: number; page: number; pageSize: number }> {
        const { search, page = 1, pageSize = 10, includeInactive = false, teamId, hackathonId } = params;
        const filter: Filter<CertificateTemplate> = {};
        if (!includeInactive) filter.isActive = true;
        if (search) {
            filter.title = { $regex: search, $options: "i" };
        }
        if (teamId) {
            filter.teamId = new ObjectId(teamId);
        }
        if (hackathonId) {
            filter.hackathonId = new ObjectId(hackathonId);
        }

        const total = await this.collection.countDocuments(filter);
        const items = await this.collection
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .toArray();

        return { items, total, page, pageSize };
    }
}
