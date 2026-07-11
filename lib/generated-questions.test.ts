import { describe, it, expect } from "vitest";
import {
  isValidDraft,
  parseGenerated,
  isDuplicate,
  dedupe,
  classifyGeminiError,
  clampCount,
  normalizeTypes,
  buildGenerationPrompt,
  GENERATION_RESPONSE_SCHEMA,
  NOT_CONFIGURED_MESSAGE,
  type GeneratedQuestion,
} from "./generated-questions";

const mcq = (overrides: Partial<Parameters<typeof isValidDraft>[0]> = {}) => ({
  prompt: "What is the base case of a recursive function?",
  answer: "B) Terminates without recursing",
  question_type: "mcq",
  options: ["A) Loops forever", "B) Terminates without recursing", "C) Calls itself", "D) None"],
  difficulty: 2,
  ...overrides,
});

// dedupe()/GeneratedQuestion want question_type narrowed to the literal
// union; isValidDraft() intentionally accepts the wider `string` (it has
// to, since raw model output isn't typed at all). mcq() stays loose to
// support the invalid-question_type rejection tests above -- this cast
// is just for the handful of call sites that pass mcq()'s output to an
// API that wants the narrowed type.
const asDraft = (d: ReturnType<typeof mcq>): GeneratedQuestion => d as GeneratedQuestion;

describe("isValidDraft", () => {
  it("accepts a well-formed mcq", () => {
    expect(isValidDraft(mcq())).toBe(true);
  });

  it("accepts a well-formed short_answer with no options", () => {
    expect(
      isValidDraft({
        prompt: "What keyword calls a parent constructor in Java?",
        answer: "super",
        question_type: "short_answer",
        options: null,
        difficulty: 1,
      })
    ).toBe(true);
  });

  it("rejects a prompt under 10 chars", () => {
    expect(isValidDraft(mcq({ prompt: "Recursion" }))).toBe(false);
  });

  it("boundary: a prompt of exactly 10 chars is accepted", () => {
    expect(isValidDraft(mcq({ prompt: "Recursion?" }))).toBe(true);
  });

  it("rejects an empty answer", () => {
    expect(isValidDraft(mcq({ answer: "  " }))).toBe(false);
  });

  it("rejects long_answer as a generated type", () => {
    expect(isValidDraft(mcq({ question_type: "long_answer", options: null }))).toBe(false);
  });

  it("rejects an unknown question_type", () => {
    expect(isValidDraft(mcq({ question_type: "true_false" }))).toBe(false);
  });

  it("boundary: difficulty 0 is rejected, difficulty 1 accepted", () => {
    expect(isValidDraft(mcq({ difficulty: 0 }))).toBe(false);
    expect(isValidDraft(mcq({ difficulty: 1 }))).toBe(true);
  });

  it("boundary: difficulty 5 is accepted, difficulty 6 rejected", () => {
    expect(isValidDraft(mcq({ difficulty: 5 }))).toBe(true);
    expect(isValidDraft(mcq({ difficulty: 6 }))).toBe(false);
  });

  it("rejects a non-integer difficulty", () => {
    expect(isValidDraft(mcq({ difficulty: 2.5 }))).toBe(false);
  });

  it("rejects an mcq with only 1 option", () => {
    expect(isValidDraft(mcq({ options: ["A) only one"] }))).toBe(false);
  });

  it("rejects an mcq whose answer is not verbatim one of its options", () => {
    expect(isValidDraft(mcq({ answer: "B) Terminates" }))).toBe(false);
  });

  it("rejects an mcq with a blank option", () => {
    expect(isValidDraft(mcq({ options: ["A) x", "  ", "C) y"] }))).toBe(false);
  });
});

describe("parseGenerated", () => {
  it("parses a clean JSON array", () => {
    const raw = JSON.stringify([mcq()]);
    expect(parseGenerated(raw)).toHaveLength(1);
  });

  it("strips ```json fences before parsing", () => {
    const raw = "```json\n" + JSON.stringify([mcq()]) + "\n```";
    expect(parseGenerated(raw)).toHaveLength(1);
  });

  it("throws a friendly error on malformed JSON", () => {
    expect(() => parseGenerated("{not valid json")).toThrow(/couldn't read/i);
  });

  it("throws a friendly error when the top level isn't an array", () => {
    expect(() => parseGenerated(JSON.stringify({ prompt: "x" }))).toThrow(/list of questions/i);
  });

  it("silently drops an individual invalid item rather than throwing", () => {
    const raw = JSON.stringify([mcq(), { prompt: "bad", answer: "", question_type: "mcq" }]);
    expect(parseGenerated(raw)).toHaveLength(1);
  });

  it("drops an mcq item whose answer doesn't match any option", () => {
    const bad = mcq({ answer: "not one of the options" });
    expect(parseGenerated(JSON.stringify([bad]))).toHaveLength(0);
  });

  it("returns an empty list (not an error) when every item is invalid", () => {
    const raw = JSON.stringify([{ prompt: "short", answer: "", question_type: "mcq" }]);
    expect(parseGenerated(raw)).toEqual([]);
  });
});

describe("isDuplicate (Jaccard token overlap)", () => {
  it("flags an exact duplicate", () => {
    expect(isDuplicate("What is recursion?", ["What is recursion?"])).toBe(true);
  });

  it("flags a near-duplicate that differs only in punctuation", () => {
    expect(
      isDuplicate("What is recursion in programming", ["What is recursion in programming?"])
    ).toBe(true);
  });

  it("does not flag a rephrasing that falls below the threshold", () => {
    // Shares 6 of 8 tokens (in/of differ) -> Jaccard 0.75, under the 0.8 bar
    expect(
      isDuplicate("What is the base case in recursion?", ["What is the base case of recursion?"])
    ).toBe(false);
  });

  it("does not flag genuinely different prompts", () => {
    expect(
      isDuplicate("What is polymorphism?", ["What is the time complexity of binary search?"])
    ).toBe(false);
  });

  it("boundary: respects a custom threshold", () => {
    // "a b c d" vs "a b x y": 2/6 intersection/union ≈ 0.33
    expect(isDuplicate("a b c d", ["a b x y"], 0.3)).toBe(true);
    expect(isDuplicate("a b c d", ["a b x y"], 0.5)).toBe(false);
  });
});

describe("dedupe", () => {
  it("drops a generated question matching an existing prompt", () => {
    const result = dedupe([asDraft(mcq())], [mcq().prompt]);
    expect(result).toHaveLength(0);
  });

  it("keeps a generated question with no match", () => {
    const result = dedupe([asDraft(mcq())], ["Completely unrelated existing prompt about streams"]);
    expect(result).toHaveLength(1);
  });

  it("dedupes within the batch itself, keeping the first occurrence", () => {
    const a = asDraft(mcq({ prompt: "What is the base case of a recursive function?" }));
    const b = asDraft(mcq({ prompt: "What is the base case of a recursive function??" }));
    const result = dedupe([a, b], []);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(a);
  });
});

describe("clampCount", () => {
  it("passes through an in-range integer", () => {
    expect(clampCount(5)).toBe(5);
  });

  it("boundary: clamps below 1 up to 1", () => {
    expect(clampCount(0)).toBe(1);
    expect(clampCount(-3)).toBe(1);
  });

  it("boundary: clamps above 8 down to 8", () => {
    expect(clampCount(8)).toBe(8);
    expect(clampCount(9)).toBe(8);
    expect(clampCount(999)).toBe(8);
  });

  it("floors a fractional count before clamping", () => {
    expect(clampCount(4.7)).toBe(4);
  });

  it("falls back to 5 for non-finite input", () => {
    expect(clampCount(NaN)).toBe(5);
  });
});

describe("normalizeTypes", () => {
  it("keeps a valid subset as-is", () => {
    expect(normalizeTypes(["mcq"])).toEqual(["mcq"]);
  });

  it("drops long_answer and anything else invalid", () => {
    expect(normalizeTypes(["mcq", "long_answer", "bogus"])).toEqual(["mcq"]);
  });

  it("de-duplicates", () => {
    expect(normalizeTypes(["mcq", "mcq", "short_answer"])).toEqual(["mcq", "short_answer"]);
  });

  it("falls back to both valid types when the input is empty or all-invalid", () => {
    expect(normalizeTypes([])).toEqual(["mcq", "short_answer"]);
    expect(normalizeTypes(["long_answer"])).toEqual(["mcq", "short_answer"]);
  });
});

describe("buildGenerationPrompt", () => {
  const base = {
    topicName: "Recursion",
    notesText: "A base case terminates without recursing.",
    count: 3,
    types: ["mcq", "short_answer"] as const,
    existingPrompts: ["What is a base case?"],
  };

  it("includes the topic name and requested count in the user prompt", () => {
    const { userPrompt } = buildGenerationPrompt({ ...base, types: [...base.types] });
    expect(userPrompt).toContain("Recursion");
    expect(userPrompt).toContain("Generate 3 question(s)");
  });

  it("includes the notes text verbatim", () => {
    const { userPrompt } = buildGenerationPrompt({ ...base, types: [...base.types] });
    expect(userPrompt).toContain(base.notesText);
  });

  it("restricts the system prompt to the requested types only", () => {
    const { systemPrompt } = buildGenerationPrompt({ ...base, types: ["mcq"] });
    expect(systemPrompt).toContain("mcq");
    expect(systemPrompt).not.toContain("short_answer");
  });

  it("embeds existing prompts so the model avoids repeating them", () => {
    const { systemPrompt } = buildGenerationPrompt({ ...base, types: [...base.types] });
    expect(systemPrompt).toContain("What is a base case?");
  });
});

describe("GENERATION_RESPONSE_SCHEMA", () => {
  it("requires every field parseGenerated/isValidDraft actually depend on", () => {
    expect(GENERATION_RESPONSE_SCHEMA.items.required).toEqual(
      expect.arrayContaining(["prompt", "answer", "question_type", "difficulty"])
    );
  });
});

describe("classifyGeminiError", () => {
  it("gives the not-configured message for 401 and 403, not a 'try again' message", () => {
    expect(classifyGeminiError(401)).toBe(NOT_CONFIGURED_MESSAGE);
    expect(classifyGeminiError(403)).toBe(NOT_CONFIGURED_MESSAGE);
    // Retrying can never fix a bad/missing key -- asserting this stays
    // distinct from the retryable-failure wording is the whole point.
    expect(classifyGeminiError(401)).not.toMatch(/try again/i);
  });

  it("points the not-configured message at the milestone video", () => {
    expect(NOT_CONFIGURED_MESSAGE).toMatch(/milestone video/i);
  });

  it("gives a rate-limit-specific message for 429", () => {
    expect(classifyGeminiError(429)).toMatch(/rate limit/i);
  });

  it("gives a transient message for 5xx", () => {
    expect(classifyGeminiError(500)).toMatch(/try again/i);
    expect(classifyGeminiError(503)).toMatch(/try again/i);
  });

  it("gives a generic message for other statuses, and never mentions billing", () => {
    const msg = classifyGeminiError(400);
    expect(msg).toMatch(/try again/i);
    expect(msg.toLowerCase()).not.toMatch(/billing/);
  });

  it("never mentions billing for any status", () => {
    for (const status of [400, 401, 403, 404, 429, 500, 503]) {
      expect(classifyGeminiError(status).toLowerCase()).not.toMatch(/billing/);
    }
  });
});
