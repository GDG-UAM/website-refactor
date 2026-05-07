import { Collection, ObjectId, type Filter } from "mongodb";
import { type Evaluation, type EvaluationInput } from "./types";

export class EvaluationRepository {
    constructor(private collection: Collection<Evaluation>) {}

    async upsert(input: EvaluationInput, judgeId: string, rubric: { name: string; weight: number }[]): Promise<Evaluation> {
        const now = new Date();
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
        return await this.collection.findOne({ teamId: new ObjectId(teamId), judgeId });
    }

    async findByJudge(judgeId: string): Promise<Evaluation[]> {
        return await this.collection.find({ judgeId }).toArray();
    }

    async findByTeam(teamId: string): Promise<Evaluation[]> {
        return await this.collection.find({ teamId: new ObjectId(teamId) }).toArray();
    }

    async findByTeamsAndJudge(teamIds: string[], judgeId: string): Promise<Evaluation[]> {
        return await this.collection.find({ 
            teamId: { $in: teamIds.map(id => new ObjectId(id)) },
            judgeId 
        }).toArray();
    }

    async delete(teamId: string, judgeId: string): Promise<boolean> {
        const result = await this.collection.deleteOne({ teamId: new ObjectId(teamId), judgeId });
        return result.deletedCount > 0;
    }

    async createIndexes(): Promise<void> {
        await this.collection.createIndex({ teamId: 1, judgeId: 1 }, { unique: true });
        await this.collection.createIndex({ judgeId: 1 });
    }
}
