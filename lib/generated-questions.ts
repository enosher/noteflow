// lib/generated-questions.ts
//
// The gate between "whatever Gemini returned" and "a row we'd let into
// the questions table". responseMimeType: "application/json" on the API
// call is a request, not a guarantee — models still occasionally wrap
// output in markdown fences or drop a field, so every candidate gets
// checked here as if it arrived from an anonymous HTML form.

export type QuestionType = "mcq" | "short_answer";

export type GeneratedQuestion = {
  prompt: string;
  answer: string;
  question_type: QuestionType;
  options: string[] | null;
  difficulty: number;
};

// long_answer is deliberately not a valid output here, even though the
// questions table supports it. submitAnswer() marks every long_answer
// attempt correct (string-match grading isn't meaningful for free text),
// so an AI-generated long_answer question would quietly inflate a
// topic's accuracy stats with corrects nobody actually earned. Scoping
// generation to gradeable types is a quality control, not a gap —
// anyone who wants a long-answer question can still add one by hand.
export const VALID_TYPES = new Set<QuestionType>(["mcq", "short_answer"]);

// Single source of truth for "is this draft safe to insert" — run once
// right after parsing, and run again unconditionally before save, since
// a user can edit a previously-valid draft (e.g. retype the answer) into
// an invalid one in between. Trusting the parse-time check at save time
// is exactly the bug the MCQ-answer-mismatch constraint warns about.
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
    // Same rule createQuestion enforces manually: an MCQ whose answer
    // isn't verbatim one of its own options is worse than no question
    // at all — it's ungradeable and silently tanks quiz accuracy.
    if (!opts.includes(draft.answer.trim())) return false;
  }

  return true;
}

// Parses the raw model output into validated drafts. Invalid candidates
// are dropped here, before the user ever sees them — there's no value
// in showing someone a card they can't save anyway; better to just
// generate one fewer question than to hand over a broken review item.
export function parseGenerated(raw: string): GeneratedQuestion[] {
  // Belt-and-suspenders: responseMimeType should stop this, but models
  // sometimes wrap JSON in ```json fences regardless of instructions.
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

// Token-set Jaccard similarity. Exact-string dedup misses trivial
// rephrasings ("What is inheritance?" vs "What's inheritance?"), and
// full semantic dedup would mean pulling in embeddings for a single
// button click — token overlap at 0.8 is the pragmatic middle, chosen
// by eyeballing real near-duplicate pairs during development (see
// decisions-log.md).
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

// Filters generated questions against both the topic's existing
// questions AND each other — without the second check, a batch could
// pass dedup against the DB while still containing two near-identical
// generated prompts side by side in the review list.
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

// Server-side clamp for the count field on the generate form. The UI
// input already has min/max attributes, but HTML attributes are a
// suggestion, not a guarantee -- anyone can hit the server action
// directly with count: 999. Floor() before clamping so "4.7" from a
// stray form quirk doesn't become a fractional question count.
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

// The JSON shape we ask Gemini to honour via generationConfig.responseSchema,
// on top of responseMimeType: "application/json". Best-effort only --
// parseGenerated() above doesn't trust that either constraint actually
// held, so a schema quirk on Gemini's side degrades to "fewer questions
// survive parsing", never to a bad row reaching the database.
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

// Builds both halves of the Gemini request. Kept pure (string-in,
// string-out) so prompt wording changes are unit-testable without a
// live API call -- e.g. "does the prompt actually mention the topic
// name" is a one-line assertion instead of a manual check.
export function buildGenerationPrompt(params: {
  topicName: string;
  notesText: string;
  count: number;
  types: QuestionType[];
  existingPrompts: string[];
}): { systemPrompt: string; userPrompt: string } {
  const typeList = params.types.join(" or ");
  // Interpolated rather than hardcoded -- if the caller only asked for
  // mcq, the format line shouldn't imply short_answer is still on the
  // table, or the "only generate X" rule right below it contradicts
  // the shape above it.
  const typeUnion = params.types.map((t) => `"${t}"`).join(" | ");

  // Per-type rule lines are conditional, not just the union above --
  // handing the model an "options must be null" instruction for a type
  // it was told not to generate is noise at best, contradictory at worst.
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
- Questions must be answerable from the notes alone -- don't invent facts the notes don't support.
${typeRules.join("\n")}
- Do not repeat or trivially rephrase any of these existing questions: ${JSON.stringify(
    params.existingPrompts.slice(0, 30)
  )}`;

  const userPrompt = `Topic: ${params.topicName}\n\nGenerate ${params.count} question(s) from these notes:\n\n${params.notesText}`;

  return { systemPrompt, userPrompt };
}

// Shown whenever the deployment itself can't talk to Gemini at all --
// missing GEMINI_API_KEY, or a key Gemini rejects outright (401/403).
// Distinct from every other message here on purpose: "try again" is
// actively bad advice for a config problem, since retrying can never
// fix it. An evaluator hitting this on a live deployment has no way to
// resolve it themselves, so the message points at proof the feature
// works instead of asking them to do something that won't help.
export const NOT_CONFIGURED_MESSAGE =
  "AI question generation isn't configured on this deployment right now — see the milestone video for a live demo of this feature.";

// Maps a Gemini HTTP failure to a message a user can act on. Split out
// as a pure function (rather than inlined in the fetch call) so the
// mapping itself is unit-testable without a network mock — and so a
// 429 reads as "wait a bit", not the same generic wording as a 500.
// Never suggests enabling billing: on the free tier that's a trap, not
// a fix (it deletes the free tier rather than lifting a limit).
export function classifyGeminiError(status: number): string {
  if (status === 401 || status === 403) {
    return NOT_CONFIGURED_MESSAGE;
  }
  if (status === 429) {
    return "Gemini's free-tier rate limit is maxed out right now — wait a minute and try again.";
  }
  if (status >= 500) {
    return "Gemini is having trouble on its end — try again shortly.";
  }
  return "Question generation is unavailable right now — try again in a moment.";
}
