// lib/generated-questions.ts
//
// The gate between "whatever Gemini returned" and a row worth inserting.
// responseMimeType: "application/json" is a request, not a guarantee, so
// every candidate is checked here as if it came from an anonymous form.

export type QuestionType = "mcq" | "short_answer";

export type GeneratedQuestion = {
  prompt: string;
  answer: string;
  question_type: QuestionType;
  options: string[] | null;
  difficulty: number;
};

// long_answer is deliberately excluded even though the questions table
// supports it: submitAnswer() marks every long_answer attempt correct,
// so an AI-generated one would quietly inflate accuracy stats. Anyone
// who wants one can still add it by hand.
export const VALID_TYPES = new Set<QuestionType>(["mcq", "short_answer"]);

// Single source of truth for "is this draft safe to insert." Runs once
// after parsing and again before save, since a user can edit a draft
// (retype the answer) into invalid between those two points.
export function isValidDraft(draft: {
  prompt: string;
  answer: string;
  question_type: string;
  options: string[] | null;
  difficulty: number;
}): boolean {
  if (!draft.prompt.trim() || draft.prompt.trim().length < 10) return false;
  if (!draft.answer.trim()) return false;
  if (!VALID_TYPES.has(draft.question_type as QuestionType)) return false;
  if (!Number.isInteger(draft.difficulty) || draft.difficulty < 1 || draft.difficulty > 5) {
    return false;
  }

  if (draft.question_type === "mcq") {
    const opts = draft.options;
    if (!Array.isArray(opts) || opts.length < 2) return false;
    if (opts.some((o) => typeof o !== "string" || !o.trim())) return false;
    // Same rule createQuestion enforces manually: an answer that isn't
    // verbatim one of its own options is ungradeable, not just wrong.
    if (!opts.includes(draft.answer.trim())) return false;
  }

  return true;
}

// Parses raw model output into validated drafts. Invalid candidates are
// dropped before the user sees them - better to generate one fewer
// question than hand over a broken review card.
export function parseGenerated(raw: string): GeneratedQuestion[] {
  // Extra safety check: responseMimeType should stop this, but models
  // sometimes wrap JSON in ```json fences anyway.
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned something we couldn't read as JSON. Try generating again.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Gemini didn't return a list of questions. Try generating again.");
  }

  const out: GeneratedQuestion[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) continue;
    const q = item as Record<string, unknown>;

    if (typeof q.prompt !== "string") continue;
    if (typeof q.answer !== "string") continue;
    if (typeof q.question_type !== "string") continue;

    const difficulty = Number(q.difficulty);
    const options = Array.isArray(q.options)
      ? q.options.filter((o): o is string => typeof o === "string")
      : null;

    const candidate = {
      prompt: q.prompt.trim(),
      answer: q.answer.trim(),
      question_type: q.question_type,
      options: options && options.length > 0 ? options : null,
      difficulty,
    };

    if (!isValidDraft(candidate)) continue;

    out.push(candidate as GeneratedQuestion);
  }
  return out;
}

// Compares two questions by how many words they share, since an exact
// text match would miss simple rewordings. 80% shared words is the
// cutoff, chosen by testing it against real near-duplicate examples.
function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
  );
}

export function isDuplicate(
  candidate: string,
  existingPrompts: string[],
  threshold = 0.8
): boolean {
  const c = tokens(candidate);
  if (c.size === 0) return true;
  for (const existing of existingPrompts) {
    const e = tokens(existing);
    let intersection = 0;
    for (const tok of c) if (e.has(tok)) intersection++;
    const union = c.size + e.size - intersection;
    if (union > 0 && intersection / union >= threshold) return true;
  }
  return false;
}

// Filters against both existing questions and each other - without the
// second check, a batch could pass DB dedup while still holding two
// near-identical prompts side by side in the review list.
export function dedupe(
  generated: GeneratedQuestion[],
  existingPrompts: string[]
): GeneratedQuestion[] {
  const kept: GeneratedQuestion[] = [];
  const seen = [...existingPrompts];
  for (const g of generated) {
    if (!isDuplicate(g.prompt, seen)) {
      kept.push(g);
      seen.push(g.prompt);
    }
  }
  return kept;
}

// Server-side clamp for the count field: HTML min/max attributes are a
// suggestion, not a guarantee, since anyone can hit the action directly
// with count: 999. Floored first so "4.7" can't sneak through.
export function clampCount(count: number): number {
  const n = Math.floor(count);
  if (!Number.isFinite(n)) return 5;
  return Math.min(Math.max(n, 1), 8);
}

// Same defense for the type checkboxes: falls back to "both types" if
// the request arrives with an empty or entirely-invalid list, rather
// than asking Gemini to generate zero of anything.
export function normalizeTypes(types: string[]): QuestionType[] {
  const filtered = types.filter((t): t is QuestionType => VALID_TYPES.has(t as QuestionType));
  const unique = Array.from(new Set(filtered));
  return unique.length > 0 ? unique : ["mcq", "short_answer"];
}

// The shape requested via generationConfig.responseSchema, on top of
// responseMimeType. Best-effort only - parseGenerated() above still
// distrusts both, so a schema quirk means fewer survivors, never a bad row.
export const GENERATION_RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      prompt: { type: "STRING" },
      answer: { type: "STRING" },
      question_type: { type: "STRING", enum: ["mcq", "short_answer"] },
      options: { type: "ARRAY", items: { type: "STRING" }, nullable: true },
      difficulty: { type: "INTEGER" },
    },
    required: ["prompt", "answer", "question_type", "difficulty"],
  },
} as const;

// Builds both halves of the Gemini request. Just takes strings in and
// returns strings out, so wording changes can be tested without a live
// call - "does the prompt mention the topic name" becomes one check.
export function buildGenerationPrompt(params: {
  topicName: string;
  notesText: string;
  count: number;
  types: QuestionType[];
  existingPrompts: string[];
}): { systemPrompt: string; userPrompt: string } {
  const typeList = params.types.join(" or ");
  // Interpolated, not hardcoded - if the caller asked for mcq only, the
  // format line shouldn't imply short_answer is still on the table.
  const typeUnion = params.types.map((t) => `"${t}"`).join(" | ");

  // Per-type rules are conditional too - an "options must be null"
  // instruction for a type that wasn't requested is just noise.
  const typeRules = [
    params.types.includes("mcq")
      ? '- For mcq: 2 to 4 options, and "answer" must be copied verbatim from one of them.'
      : null,
    params.types.includes("short_answer")
      ? '- For short_answer: "options" must be null and the answer should be short and unambiguous.'
      : null,
  ].filter(Boolean);

  const systemPrompt = `You generate practice questions for a university student, strictly from the study notes they provide.
Return ONLY a JSON array, no markdown fences, no prose. Each element:
{"prompt": string, "answer": string, "question_type": ${typeUnion}, "options": [2-4 strings] | null, "difficulty": 1-5}
Rules:
- Only generate these question types: ${typeList}.
- Questions must be answerable from the notes alone - don't invent facts the notes don't support.
${typeRules.join("\n")}
- Do not repeat or trivially rephrase any of these existing questions: ${JSON.stringify(
    params.existingPrompts.slice(0, 30)
  )}`;

  const userPrompt = `Topic: ${params.topicName}\n\nGenerate ${params.count} question(s) from these notes:\n\n${params.notesText}`;

  return { systemPrompt, userPrompt };
}

// Shown when the deployment can't talk to Gemini at all: missing
// GEMINI_API_KEY, or a key Gemini rejects outright (401/403). "Try again"
// is bad advice for a config problem an evaluator can't fix themselves,
// so this points at proof the feature works instead.
export const NOT_CONFIGURED_MESSAGE =
  "AI question generation isn't configured on this deployment right now - see the milestone video for a live demo of this feature.";

// Well under Gemini's real free-tier ceiling: one shared GEMINI_API_KEY
// means an enthusiastic tester spamming "Generate" could otherwise
// exhaust the day's quota and lock everyone else out. Tripping this cap
// first, before Google's own 429, keeps the message specific.
export const DAILY_GENERATION_CAP = 40;

// Distinct from classifyGeminiError's 429: a real Gemini rate limit is
// per-minute, but this cap means the day's shared allowance is spent.
// "Try again in a minute" would mislead, so this points at proof the
// feature works instead, same reasoning as NOT_CONFIGURED_MESSAGE.
export const USAGE_CAPPED_MESSAGE =
  "AI question generation has hit its shared usage cap for today - see the milestone video for a live demo of this feature, or try again tomorrow.";

export function isOverDailyCap(callsInLast24h: number): boolean {
  return callsInLast24h >= DAILY_GENERATION_CAP;
}

// Maps a Gemini failure to a message a user can act on. Pulled out as
// its own function so it can be tested without a real network call, and
// a 429 reads as "wait a bit" instead of generic error wording.
export function classifyGeminiError(status: number): string {
  if (status === 401 || status === 403) {
    return NOT_CONFIGURED_MESSAGE;
  }
  if (status === 429) {
    return "Gemini's free-tier rate limit is maxed out right now - wait a minute and try again.";
  }
  if (status >= 500) {
    return "Gemini is having trouble on its end - try again shortly.";
  }
  return "Question generation is unavailable right now - try again in a moment.";
}
