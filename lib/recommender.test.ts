import { describe, it, expect } from "vitest";
import {
  topicWeaknessScore,
  recencyBoostScore,
  mistakeRecencyScore,
  difficultyMatchScore,
  scoreQuestion,
  getScoreBreakdown,
  applyBlockedPenalty,
} from "./recommender";

describe("topicWeaknessScore", () => {
  it("scores a weak topic (low accuracy) higher than a strong one", () => {
    expect(topicWeaknessScore(0)).toBeGreaterThan(topicWeaknessScore(0.9));
  });

  it("treats an unattempted topic as moderately weak", () => {
    expect(topicWeaknessScore(undefined)).toBe(0.5);
  });
});

describe("recencyBoostScore", () => {
  it("boosts a question not attempted in over a week", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(recencyBoostScore(twoWeeksAgo)).toBe(1);
  });

  it("does not boost a question attempted yesterday", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(recencyBoostScore(yesterday)).toBe(0);
  });

  it("boosts a never-attempted question", () => {
    expect(recencyBoostScore(null)).toBe(1);
  });

  // RECENCY_WINDOW_DAYS is 7; the two tests above use 14 days and 1 day,
  // well clear of the line. These pin the boundary itself: the check is
  // `daysSince >= 7`, so exactly 7 days must already count as overdue.
  it("boundary: exactly 7 days ago counts as overdue (the >= cutoff)", () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(recencyBoostScore(sevenDaysAgo)).toBe(1);
  });

  it("boundary: just under 7 days ago does not yet boost", () => {
    // One minute short of 7 days - comfortably on the "not yet" side
    // even accounting for the small delay between building this
    // timestamp and the function's own Date.now() call.
    const almostSevenDays = new Date(
      Date.now() - (7 * 24 * 60 * 60 * 1000 - 60 * 1000)
    ).toISOString();
    expect(recencyBoostScore(almostSevenDays)).toBe(0);
  });
});

describe("mistakeRecencyScore", () => {
  it("scores higher when the last attempt was wrong", () => {
    expect(mistakeRecencyScore(false)).toBeGreaterThan(mistakeRecencyScore(true));
  });

  it("scores zero when there's no attempt history", () => {
    expect(mistakeRecencyScore(null)).toBe(0);
  });
});

describe("difficultyMatchScore", () => {
  it("scores highest when difficulty exactly matches the user's average", () => {
    expect(difficultyMatchScore(3, 3)).toBe(1);
  });

  it("scores lower the further difficulty is from the user's average", () => {
    expect(difficultyMatchScore(5, 1)).toBeLessThan(difficultyMatchScore(3, 1));
  });
});

describe("scoreQuestion", () => {
  it("a weak, overdue, recently-wrong, well-matched question scores at the top of the range", () => {
    const score = scoreQuestion({
      topicAccuracy: 0,
      lastAttemptedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastAttemptCorrect: false,
      questionDifficulty: 3,
      userAvgDifficulty: 3,
    });
    // All four terms maxed -> score equals the sum of the weights (1.0)
    expect(score).toBeCloseTo(1, 5);
  });

  it("a strong, recently-correct topic scores near the bottom of the range", () => {
    const score = scoreQuestion({
      topicAccuracy: 1,
      lastAttemptedAt: new Date().toISOString(),
      lastAttemptCorrect: true,
      questionDifficulty: 3,
      userAvgDifficulty: 3,
    });
    expect(score).toBeLessThan(0.2);
  });
});

describe("getScoreBreakdown", () => {
  const input = {
    topicAccuracy: 0.3,
    lastAttemptedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastAttemptCorrect: false,
    questionDifficulty: 4,
    userAvgDifficulty: 2,
  };

  it("total always matches scoreQuestion for the same input - the debug view can never show a number that disagrees with the real score", () => {
    expect(getScoreBreakdown(input).total).toBeCloseTo(scoreQuestion(input), 10);
  });

  it("returns exactly the four scoring terms", () => {
    const { terms } = getScoreBreakdown(input);
    expect(terms.map((t) => t.label)).toEqual([
      "Topic weakness",
      "Recency boost",
      "Mistake recency",
      "Difficulty match",
    ]);
  });

  it("each term's weighted value is rawScore times weight", () => {
    const { terms } = getScoreBreakdown(input);
    for (const term of terms) {
      expect(term.weighted).toBeCloseTo(term.rawScore * term.weight, 10);
    }
  });
});

describe("applyBlockedPenalty", () => {
  it("halves the score when the topic is blocked", () => {
    expect(applyBlockedPenalty(0.8, true)).toBeCloseTo(0.4);
  });

  it("leaves the score untouched when not blocked", () => {
    expect(applyBlockedPenalty(0.8, false)).toBe(0.8);
  });
});