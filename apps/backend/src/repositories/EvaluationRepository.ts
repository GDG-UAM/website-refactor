import { Collection, ObjectId, type Filter } from "mongodb";
import { type Evaluation, type EvaluationInput } from "./types";

export class EvaluationRepository {
    constructor(private collection: Collection<Evaluation>) {}

    async upsert(input: EvaluationInput, judgeId: string, rubric: { name: string; weight: number }[]): Promise<Evaluation> {
        const now = new Date();
        if (!ObjectId.isValid(input.teamId)) throw new Error("Invalid teamId");
        const teamId = new ObjectId(input.teamId);

        // Compute total score (weighted average of rubric items)
        let weightedSum = 0;
        let totalWeight = 0;

        for (const item of rubric) {
            const score = input.scores[item.name] || 0;
            weightedSum += score * item.weight;
            totalWeight += item.weight;
        }

        const totalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

        const evaluation: Partial<Evaluation> = {
            teamId,
            judgeId,
            scores: input.scores,
            totalScore,
            notes: input.notes,
            updatedAt: now
        };

        const result = await this.collection.findOneAndUpdate(
            { teamId, judgeId },
            { 
                $set: evaluation,
                $setOnInsert: { createdAt: now } as any
            },
            { upsert: true, returnDocument: "after" }
        );

        return result!;
    }

    async findByTeamAndJudge(teamId: string, judgeId: string): Promise<Evaluation | null> {
        if (!ObjectId.isValid(teamId)) return null;
        return await this.collection.findOne({ teamId: new ObjectId(teamId), judgeId });
    }

    async findByJudge(judgeId: string): Promise<Evaluation[]> {
        return await this.collection.find({ judgeId }).toArray();
    }

    async findByTeam(teamId: string): Promise<Evaluation[]> {
        if (!ObjectId.isValid(teamId)) return [];
        return await this.collection.find({ teamId: new ObjectId(teamId) }).toArray();
    }

    async findByTeamsAndJudge(teamIds: string[], judgeId: string): Promise<Evaluation[]> {
        const validTeamIds = teamIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
        return await this.collection.find({ 
            teamId: { $in: validTeamIds },
            judgeId 
        }).toArray();
    }

    async delete(teamId: string, judgeId: string): Promise<boolean> {
        if (!ObjectId.isValid(teamId)) return false;
        const result = await this.collection.deleteOne({ teamId: new ObjectId(teamId), judgeId });
        return result.deletedCount > 0;
    }

    async getTrackLeaderboard(teamIds: ObjectId[]): Promise<{ teamId: string; averageScore: number; count: number }[]> {
        const results = await this.collection.aggregate([
            { $match: { teamId: { $in: teamIds } } },
            { $group: {
                _id: "$teamId",
                averageScore: { $avg: "$totalScore" },
                count: { $sum: 1 }
            }}
        ]).toArray();

        return results.map(r => ({
            teamId: r._id.toString(),
            averageScore: r.averageScore,
            count: r.count
        }));
    }

    async createIndexes(): Promise<void> {
        await this.collection.createIndex({ teamId: 1, judgeId: 1 }, { unique: true });
        await this.collection.createIndex({ judgeId: 1 });
    }
}
