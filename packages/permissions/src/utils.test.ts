import { describe, it, expect } from "bun:test";
import { getNestedValue, evaluateConditions, hashResourcePath } from "./utils";

describe("utils", () => {
    describe("getNestedValue", () => {
        it("should get top-level value", () => {
            const obj = { a: 1 };
            expect(getNestedValue(obj, "a")).toBe(1);
        });

        it("should get nested value", () => {
            const obj = { a: { b: { c: 3 } } };
            expect(getNestedValue(obj, "a.b.c")).toBe(3);
        });

        it("should return undefined for non-existent path", () => {
            const obj = { a: 1 };
            expect(getNestedValue(obj, "b")).toBeUndefined();
            expect(getNestedValue(obj, "a.b")).toBeUndefined();
        });
    });

    describe("evaluateConditions", () => {
        it("should return undefined if conditions is undefined", () => {
            expect(evaluateConditions(undefined, {})).toBeUndefined();
        });

        it("should replace template strings", () => {
            const conditions = { userId: "{user.id}", orgId: "{org.id}" };
            const context = { user: { id: "u1" }, org: { id: "o1" } };
            const evaluated = evaluateConditions(conditions, context);
            expect(evaluated).toEqual({ userId: "u1", orgId: "o1" });
        });

        it("should handle nested objects and arrays", () => {
            const conditions = {
                filter: {
                    owner: "{user.id}",
                    tags: ["{tag1}", "fixed"]
                }
            };
            const context = { user: { id: "u1" }, tag1: "urgent" };
            const evaluated = evaluateConditions(conditions, context);
            expect(evaluated).toEqual({
                filter: {
                    owner: "u1",
                    tags: ["urgent", "fixed"]
                }
            });
        });
        
        it("should return undefined for missing context values", () => {
            const conditions = { userId: "{user.id}" };
            const context = {};
            const evaluated = evaluateConditions(conditions, context);
            expect(evaluated).toEqual({ userId: undefined });
        });
    });

    describe("hashResourcePath", () => {
        it("should return consistent hash for same path", () => {
            const path = "hackathon.123.teams";
            const hash1 = hashResourcePath(path);
            const hash2 = hashResourcePath(path);
            expect(hash1).toBe(hash2);
        });

        it("should return different hashes for different paths", () => {
            expect(hashResourcePath("path.a")).not.toBe(hashResourcePath("path.b"));
        });
        
        it("should return a string", () => {
            expect(typeof hashResourcePath("test")).toBe("string");
        });
    });
});
