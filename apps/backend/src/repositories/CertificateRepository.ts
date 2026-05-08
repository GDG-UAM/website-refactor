import { Collection, ObjectId, type Filter, type Sort } from "mongodb";
import type { Certificate, CertificateType } from "./types";

export type CertificateInput = {
    recipient: {
        name: string;
        userId?: string | ObjectId;
    };
    designId: number;
    signatures: { name: string; role: string; imageUrl: string }[];
    startDate?: Date | string;
    endDate?: Date | string;
    title: string;
    description?: string;
    type: CertificateType;
    metadata?: any;
    templateId?: string | ObjectId;
};

export type CertificateSortTypes = "newest" | "oldest" | "title_asc" | "title_desc";

export class CertificateRepository {
    constructor(private collection: Collection<Certificate>) {}

    async create(input: CertificateInput, userId: string): Promise<Certificate> {
        const now = new Date();
        const certificate: Certificate = {
            _id: new ObjectId(),
            ...input,
            startDate: input.startDate ? new Date(input.startDate) : undefined,
            endDate: input.endDate ? new Date(input.endDate) : undefined,
            templateId: input.templateId && ObjectId.isValid(input.templateId.toString()) ? new ObjectId(input.templateId) : undefined,
            source: input.templateId ? "auto" : "manual",
            revoked: false,
            isActive: true,
            createdBy: userId,
            createdAt: now,
            updatedAt: now
        } as Certificate;

        await this.collection.insertOne(certificate);
        return certificate;
    }

    async update(id: string, input: Partial<CertificateInput>): Promise<Certificate | null> {
        const updates: Record<string, unknown> = { ...input, updatedAt: new Date() };

        delete updates._id;
        delete updates.createdBy;
        delete updates.createdAt;

        if (input.startDate !== undefined) {
            updates.startDate = input.startDate ? new Date(input.startDate) : null;
        }
        if (input.endDate !== undefined) {
            updates.endDate = input.endDate ? new Date(input.endDate) : null;
        }
        if (input.templateId !== undefined) {
            updates.templateId = input.templateId && ObjectId.isValid(input.templateId.toString()) ? new ObjectId(input.templateId) : null;
        }

        if (!ObjectId.isValid(id)) return null;
        const result = await this.collection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updates }, { returnDocument: "after" });

        return result;
    }

    async delete(id: string, soft: boolean = true): Promise<boolean> {
        if (!ObjectId.isValid(id)) return false;
        if (soft) {
            const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: { isActive: false, updatedAt: new Date() } });
            return result.modifiedCount > 0;
        } else {
            const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
            return result.deletedCount > 0;
        }
    }

    async findById(id: string, options?: { includeInactive?: boolean }): Promise<Certificate | null> {
        if (!ObjectId.isValid(id)) return null;
        const query: Filter<Certificate> = { _id: new ObjectId(id) };
        if (!options?.includeInactive) {
            query.isActive = true;
        }

        const items = (await this.collection
            .aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: "certificatetemplates",
                        localField: "templateId",
                        foreignField: "_id",
                        as: "template"
                    }
                },
                { $unwind: { path: "$template", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "hackathons",
                        localField: "template.hackathonId",
                        foreignField: "_id",
                        as: "hackathon"
                    }
                },
                { $unwind: { path: "$hackathon", preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        designId: {
                            $ifNull: ["$designId", "$template.designId", "$hackathon.certificateDefaults.designId", 0]
                        },
                        title: {
                            $ifNull: ["$title", "$template.title", "$hackathon.certificateDefaults.title", "$hackathon.title", ""]
                        },
                        startDate: { $ifNull: ["$startDate", "$template.startDate", "$hackathon.date"] },
                        endDate: { $ifNull: ["$endDate", "$template.endDate", "$hackathon.endDate"] },
                        metadata: {
                            $mergeObjects: [{ $ifNull: ["$template.metadata", {}] }, { $ifNull: ["$metadata", {}] }]
                        },
                        signatures: {
                            $ifNull: [
                                { $cond: [{ $gt: [{ $size: { $ifNull: ["$signatures", []] } }, 0] }, "$signatures", null] },
                                { $cond: [{ $gt: [{ $size: { $ifNull: ["$template.signatures", []] } }, 0] }, "$template.signatures", null] },
                                "$hackathon.certificateDefaults.signatures",
                                []
                            ]
                        }
                    }
                },
                { $unset: ["template", "hackathon"] }
            ])
            .toArray()) as Certificate[];

        return items[0] || null;
    }

    async list(params: {
        search?: string;
        page?: number;
        pageSize?: number;
        sort?: CertificateSortTypes;
        includeInactive?: boolean;
        templateId?: string;
        recipient?: string;
        type?: string;
    }): Promise<{ items: Certificate[]; total: number; page: number; pageSize: number }> {
        const { search, page = 1, pageSize = 10, sort = "newest", includeInactive = false, templateId, recipient } = params;

        const filter: Filter<Certificate> = {};
        if (!includeInactive) filter.isActive = true;
        if (templateId && ObjectId.isValid(templateId)) filter.templateId = new ObjectId(templateId);
        if (recipient) filter["recipient.userId"] = recipient;
        if (params.type && params.type !== "all") filter.type = params.type as CertificateType;

        if (search) {
            filter.$or = [{ title: { $regex: search, $options: "i" } }, { "recipient.name": { $regex: search, $options: "i" } }];
        }

        const sortMap: Record<CertificateSortTypes, Sort> = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            title_asc: { title: 1 },
            title_desc: { title: -1 }
        };

        const total = await this.collection.countDocuments(filter);
        const items = (await this.collection
            .aggregate([
                { $match: filter },
                { $sort: sortMap[sort] },
                { $skip: (page - 1) * pageSize },
                { $limit: pageSize },
                {
                    $lookup: {
                        from: "certificatetemplates",
                        localField: "templateId",
                        foreignField: "_id",
                        as: "template"
                    }
                },
                { $unwind: { path: "$template", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "hackathons",
                        localField: "template.hackathonId",
                        foreignField: "_id",
                        as: "hackathon"
                    }
                },
                { $unwind: { path: "$hackathon", preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        designId: {
                            $ifNull: ["$designId", "$template.designId", "$hackathon.certificateDefaults.designId", 0]
                        },
                        title: {
                            $ifNull: ["$title", "$template.title", "$hackathon.certificateDefaults.title", "$hackathon.title", ""]
                        },
                        startDate: { $ifNull: ["$startDate", "$template.startDate", "$hackathon.date"] },
                        endDate: { $ifNull: ["$endDate", "$template.endDate", "$hackathon.endDate"] },
                        metadata: {
                            $mergeObjects: [{ $ifNull: ["$template.metadata", {}] }, { $ifNull: ["$metadata", {}] }]
                        },
                        signatures: {
                            $ifNull: [
                                { $cond: [{ $gt: [{ $size: { $ifNull: ["$signatures", []] } }, 0] }, "$signatures", null] },
                                { $cond: [{ $gt: [{ $size: { $ifNull: ["$template.signatures", []] } }, 0] }, "$template.signatures", null] },
                                "$hackathon.certificateDefaults.signatures",
                                []
                            ]
                        }
                    }
                },
                { $unset: ["template", "hackathon"] }
            ])
            .toArray()) as Certificate[];

        return { items, total, page, pageSize };
    }

    async revoke(id: string): Promise<boolean> {
        if (!ObjectId.isValid(id)) return false;
        const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: { revoked: true, updatedAt: new Date() } });
        return result.modifiedCount > 0;
    }

    async deleteByTemplateId(templateId: string | ObjectId, soft: boolean = true): Promise<void> {
        if (!ObjectId.isValid(templateId.toString())) return;
        const tid = new ObjectId(templateId);
        if (soft) {
            await this.collection.updateMany({ templateId: tid }, { $set: { isActive: false, updatedAt: new Date() } });
        } else {
            await this.collection.deleteMany({ templateId: tid });
        }
    }

    async createIndexes(): Promise<void> {
        await this.collection.createIndex({ recipient: 1 });
        await this.collection.createIndex({ templateId: 1 });
        await this.collection.createIndex({ isActive: 1 });
        await this.collection.createIndex({ createdAt: -1 });
    }
}
