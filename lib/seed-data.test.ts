import { describe, it, expect } from "vitest";
import { SEED_MODULES } from "./seed-data";

// Regression guard for the M3 user-testing finding: a topic with zero
// notes (or file-only notes with no text content) makes AI question
// generation fail immediately with "no usable note content." Every
// seeded topic should have at least one note with real text, so a
// tester using the sample data never hits that wall by accident.
describe("SEED_MODULES note coverage", () => {
  for (const mod of SEED_MODULES) {
    it(`every topic in ${mod.code} has at least one note with content`, () => {
      const notedTopics = new Set(mod.notes.map((n) => n.topic));
      for (const topic of mod.topics) {
        expect(notedTopics.has(topic.name)).toBe(true);
      }
    });

    it(`every note in ${mod.code} has non-empty content`, () => {
      for (const note of mod.notes) {
        expect(note.content.trim().length).toBeGreaterThan(0);
      }
    });
  }
});
