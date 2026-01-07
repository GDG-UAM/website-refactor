import { describe, it, expect } from "bun:test";
import { parsePattern, matchesPattern, expandPattern, validatePattern } from "./parser";

describe("parser", () => {
    describe("parsePattern", () => {
        it("should parse literal patterns", () => {
            const parsed = parsePattern("hackathon.teams");
            expect(parsed.segments).toEqual([
                { type: "literal", value: "hackathon" },
                { type: "literal", value: "teams" }
            ]);
            expect(parsed.depth).toBe(2);
            expect(parsed.hasWildcard).toBe(false);
            expect(parsed.hasPlaceholder).toBe(false);
        });

        it("should parse wildcard patterns", () => {
            const parsed = parsePattern("hackathon.*");
            expect(parsed.segments).toEqual([
                { type: "literal", value: "hackathon" },
                { type: "wildcard", value: "*" }
            ]);
            expect(parsed.hasWildcard).toBe(true);
        });

        it("should parse placeholder patterns", () => {
            const parsed = parsePattern("hackathon.{id}.teams");
            expect(parsed.segments).toEqual([
                { type: "literal", value: "hackathon" },
                { type: "placeholder", value: "{id}", param: "id" },
                { type: "literal", value: "teams" }
            ]);
            expect(parsed.hasPlaceholder).toBe(true);
        });
    });

    describe("matchesPattern", () => {
        it("should match literal patterns", () => {
            const pattern = parsePattern("hackathon.teams").segments;
            expect(matchesPattern(pattern, ["hackathon", "teams"])).toBe(true);
            expect(matchesPattern(pattern, ["hackathon", "members"])).toBe(false);
            expect(matchesPattern(pattern, ["hackathon"])).toBe(false);
        });

        it("should match wildcard patterns", () => {
            const pattern = parsePattern("hackathon.*").segments;
            expect(matchesPattern(pattern, ["hackathon", "teams"])).toBe(true);
            expect(matchesPattern(pattern, ["hackathon", "any", "thing"])).toBe(true);
            expect(matchesPattern(pattern, ["hackathon"])).toBe(true);
            expect(matchesPattern(pattern, ["other"])).toBe(false);
        });

        it("should match middle wildcards correctly", () => {
             // Non-trailing wildcard matches exactly one segment
            const pattern = parsePattern("hackathon.*.teams").segments;
            expect(matchesPattern(pattern, ["hackathon", "123", "teams"])).toBe(true);
            expect(matchesPattern(pattern, ["hackathon", "123", "456", "teams"])).toBe(false);
        });

        it("should match placeholder patterns", () => {
            const pattern = parsePattern("hackathon.{id}.teams").segments;
            expect(matchesPattern(pattern, ["hackathon", "123", "teams"])).toBe(true);
            expect(matchesPattern(pattern, ["hackathon", "456", "teams"])).toBe(true);
            expect(matchesPattern(pattern, ["hackathon", "123", "members"])).toBe(false);
        });
    });

    describe("expandPattern", () => {
        it("should expand placeholders", () => {
            const expanded = expandPattern("hackathon.{id}.teams", { id: "123" });
            expect(expanded).toBe("hackathon.123.teams");
        });

        it("should expand multiple placeholders", () => {
            const expanded = expandPattern("org.{orgId}.user.{userId}", { orgId: "abc", userId: "456" });
            expect(expanded).toBe("org.abc.user.456");
        });
    });

    describe("validatePattern", () => {
        it("should return valid for correct patterns", () => {
            expect(validatePattern("hackathon.teams").valid).toBe(true);
            expect(validatePattern("hackathon.*").valid).toBe(true);
            expect(validatePattern("hackathon.{id}.teams").valid).toBe(true);
        });

        it("should return invalid for empty patterns", () => {
            expect(validatePattern("").valid).toBe(false);
            expect(validatePattern("  ").valid).toBe(false);
        });

        it("should return invalid for empty segments", () => {
            expect(validatePattern("hackathon..teams").valid).toBe(false);
        });

        it("should return invalid for malformed placeholders", () => {
            expect(validatePattern("hackathon.{id.teams").valid).toBe(false);
            expect(validatePattern("hackathon.{123}.teams").valid).toBe(false);
        });

        it("should return invalid for invalid characters in segments", () => {
            expect(validatePattern("hackathon.te@ms").valid).toBe(false);
        });
    });
});
