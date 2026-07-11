"use server";

// Two-phase flow, deliberately: generateQuestionDrafts() never writes to
// the database, and saveGeneratedQuestions() never talks to Gemini.
// Splitting them is what makes "review before save" possible at all --
// a single do-everything action would have nowhere to pause for the
// human-in-the-loop step.
//
// Expected failures are RETURNED, not thrown. Next.js redacts the
// message of any thrown Error crossing a Server Action boundary in
// production builds -- the client only ever sees a generic "omitted in
// production" string, which silently defeats every friendly message
// below (rate limit, not-configured, no notes, etc.). Returning a
// { ok: false, message } result instead sidesteps that redaction
// entirely, since it's ordinary serialized data, not an Error object.
// redirect() is the one exception -- Next.js treats it as a distinct
// internal signal, unaffected by this redaction.

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyMessage } from "@/lib/errors";
import {
  buildGenerationPrompt,
  classifyGeminiError,
  clampCount,
  dedupe,
  GENERATION_RESPONSE_SCHEMA,
  isValidDraft,
  normalizeTypes,
  NOT_CONFIGURED_MESSAGE,
  parseGenerated,
  type GeneratedQuestion,
} from "@/lib/generated-questions";

// gemini-2.5-flash started 404ing for new API keys/projects on Jul 9 2026
// (Google's own deprecations page still lists it as valid until Oct 16
// 2026, but new keys got cut off early -- 
// see https://discuss.ai.google.dev/t/gemini-2-5-flash-and-gemini-2-5-flash-lite-returning-404-no-longer-available-today-july-9-contradicts-oct-16-2026-shutdown-date/174267).
// gemini-3.5-flash is Google's own listed replacement and the current default flash model, still on the free tier.
const MODEL = "gemini-3.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Bounds the notes blob regardless of how much a topic has accumulated --
// a topic with 40 subtopic notes shouldn't turn one button click into a
// multi-thousand-token request. Cut, not summarized: summarizing would
// need its own model call, defeating the point of keeping this cheap.
const MAX_NOTES_CHARS = 12000;

export type GenerateResult =
  | { ok: true; drafts: GeneratedQuestion[] }
  | { ok: false; message: string };

export async function generateQuestionDrafts(
  topicId: string,
  count: number,
  requestedTypes: string[]
): Promise<GenerateResult> {
  // Checked first, before any DB round trip -- a missing key means this
  // deployment can never generate anything no matter what's in the
  // topic's notes, so there's no point spending queries to find that
  // out. This is the single most likely real failure mode on a fresh
  // deployment (env var never added to Vercel), and the one where
  // "try again" is actively unhelpful advice.
  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, message: NOT_CONFIGURED_MESSAGE };
  }

  const supabase = await createClient();

  const { data: topic, error: topicErr } = await supabase
    .from("topics")
    .select("name")
    .eq("id", topicId)
    .single();
  // Genuinely unexpected (the page itself already 404s on a missing
  // topic) rather than a friendly guidance case, so this one throws
  // and falls to the generic error boundary rather than the review UI.
  if (topicErr || !topic) throw new Error("Topic not found.");

  // Topic-level notes and subtopic notes are two separate queries rather
  // than one embed -- same "testable flat queries over a clever join"
  // trade-off lib/weak-topics.ts documents for getTopicAccuracy.
  const { data: topicNotes, error: notesErr } = await supabase
    .from("notes")
    .select("title, content")
    .eq("topic_id", topicId);
  if (notesErr) return { ok: false, message: friendlyMessage(notesErr) };

  const { data: subtopics, error: subtopicsErr } = await supabase
    .from("subtopics")
    .select("id")
    .eq("topic_id", topicId);
  if (subtopicsErr) return { ok: false, message: friendlyMessage(subtopicsErr) };

  const subtopicIds = (subtopics ?? []).map((s) => s.id);
  let subtopicNotes: { title: string; content: string | null }[] = [];
  if (subtopicIds.length > 0) {
    const { data, error } = await supabase
      .from("notes")
      .select("title, content")
      .in("subtopic_id", subtopicIds);
    if (error) return { ok: false, message: friendlyMessage(error) };
    subtopicNotes = data ?? [];
  }

  // File-only notes (content null) can't be read here -- there's no text
  // extraction step for arbitrary uploads in this feature -- so they're
  // skipped rather than surfaced as an error. A topic that's ALL file
  // notes falls through to the "no usable content" check below.
  const usableNotes = [...(topicNotes ?? []), ...subtopicNotes].filter(
    (n) => n.content && n.content.trim().length > 0
  );

  if (usableNotes.length === 0) {
    return {
      ok: false,
      message:
        "This topic has no usable note content yet — add some notes (or notes with text, not just file attachments) before generating questions.",
    };
  }

  const notesText = usableNotes
    .map((n) => `## ${n.title}\n${n.content}`)
    .join("\n\n")
    .slice(0, MAX_NOTES_CHARS);

  const { data: existing, error: existingErr } = await supabase
    .from("questions")
    .select("prompt")
    .eq("topic_id", topicId);
  if (existingErr) return { ok: false, message: friendlyMessage(existingErr) };
  const existingPrompts = (existing ?? []).map((q) => q.prompt);

  const n = clampCount(count);
  const types = normalizeTypes(requestedTypes);

  const { systemPrompt, userPrompt } = buildGenerationPrompt({
    topicName: topic.name,
    notesText,
    count: n,
    types,
    existingPrompts,
  });

  let res: Response;
  try {
    res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Header, not a query param -- query strings are far more likely
        // to end up in a log line somewhere between here and Google.
        "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: 2000,
          // API-level JSON enforcement. responseSchema is a second,
          // best-effort layer on top -- parseGenerated below still
          // validates independently either way.
          responseMimeType: "application/json",
          responseSchema: GENERATION_RESPONSE_SCHEMA,
        },
      }),
    });
  } catch {
    // fetch() itself throwing means the request never reached Google --
    // DNS, offline, timeout. Distinct from a Gemini-side HTTP error.
    // This call runs server-side (Vercel), not in the user's browser, so
    // "check your connection" would be blaming the wrong machine.
    return { ok: false, message: "Couldn't reach Gemini right now — try again in a moment." };
  }

  if (!res.ok) {
    // Real status goes to the server log; the user gets the mapped,
    // actionable line. A 429 here is the free-tier rate limit -- never
    // suggest enabling billing, since that deletes the free tier rather
    // than lifting the limit.
    console.error("Gemini API error", res.status, await res.text().catch(() => ""));
    return { ok: false, message: classifyGeminiError(res.status) };
  }

  const body = await res.json();
  const text: string =
    body.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";

  if (!text) {
    // Empty candidates usually means the response was blocked (e.g. a
    // safety filter) rather than malformed -- worth a distinct message
    // since "try again" is actually good advice here, unlike for a
    // structural JSON failure.
    return {
      ok: false,
      message: "Gemini didn't return anything usable — try again or adjust your notes.",
    };
  }

  // parseGenerated throws on structural failure (unparseable/non-array
  // JSON) -- caught here and turned into the same result shape as every
  // other expected failure above, rather than let it escape as a thrown
  // Error and hit the redaction issue this whole file is built around.
  let parsed: GeneratedQuestion[];
  try {
    parsed = parseGenerated(text);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't read Gemini's response." };
  }

  const unique = dedupe(parsed, existingPrompts);

  if (unique.length === 0) {
    return {
      ok: false,
      message:
        "Generation produced no usable new questions (everything was invalid or a duplicate of an existing question). Try again or add more notes.",
    };
  }

  return { ok: true, drafts: unique };
}

export type SaveResult = { ok: false; message: string };

// No success branch in the return type: on success this ends in
// redirect(), which never returns to the caller. Only the failure path
// needs a shape the client can read.
export async function saveGeneratedQuestions(
  topicId: string,
  drafts: GeneratedQuestion[]
): Promise<SaveResult | void> {
  const supabase = await createClient();

  // Re-validated here even though parseGenerated already checked each
  // draft once -- the drafts arriving at this action came back through
  // the review UI, where the user can edit any field (including turning
  // a previously-valid MCQ answer into one that no longer matches its
  // options). Trusting the earlier check would be exactly the "validate
  // before save, not after" bug this feature was built to avoid.
  const valid = drafts
    .map((d) => ({
      ...d,
      prompt: d.prompt.trim(),
      answer: d.answer.trim(),
      options: d.options ? d.options.map((o) => o.trim()) : null,
    }))
    .filter(isValidDraft);

  if (valid.length === 0) {
    return { ok: false, message: "None of the selected questions passed validation — edit and try again." };
  }

  const { error } = await supabase.from("questions").insert(
    valid.map((d) => ({
      topic_id: topicId,
      subtopic_id: null,
      prompt: d.prompt,
      answer: d.answer,
      options: d.options,
      question_type: d.question_type,
      difficulty: d.difficulty,
      source: "ai",
    }))
  );
  if (error) return { ok: false, message: friendlyMessage(error) };

  const { data: topic } = await supabase
    .from("topics")
    .select("module_id")
    .eq("id", topicId)
    .single();

  revalidatePath(`/modules/${topic?.module_id}/topics/${topicId}`);
  redirect(`/modules/${topic?.module_id}/topics/${topicId}`);
}
