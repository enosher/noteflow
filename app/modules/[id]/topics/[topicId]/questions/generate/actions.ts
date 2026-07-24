"use server";

// Two-phase on purpose: generateQuestionDrafts() never writes to the
// database, saveGeneratedQuestions() never talks to Gemini. That split
// is what makes "review before save" possible at all.
//
// Expected failures are returned, not thrown, since Next.js hides the
// real text of thrown errors coming from a Server Action in production.
// A plain { ok: false, message } object is just data, so it's unaffected.

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
  isOverDailyCap,
  isValidDraft,
  normalizeTypes,
  NOT_CONFIGURED_MESSAGE,
  parseGenerated,
  USAGE_CAPPED_MESSAGE,
  type GeneratedQuestion,
} from "@/lib/generated-questions";

// gemini-2.5-flash started 404ing for new API keys on Jul 9 2026, ahead
// of Google's own Oct 16 2026 shutdown date (see the forum thread:
// https://discuss.ai.google.dev/t/gemini-2-5-flash-and-gemini-2-5-flash-lite-returning-404-no-longer-available-today-july-9-contradicts-oct-16-2026-shutdown-date/174267).
// gemini-3.5-flash is Google's listed replacement, still free-tier.
const PRIMARY_MODEL = "gemini-3.5-flash";

// Added Jul 2026: gemini-3.5-flash has a known, ongoing Google-side bug
// where a request combining structured output (responseSchema +
// responseMimeType, both used below) with thinkingConfig either hangs
// with 0 response bytes or fast-fails with a 5xx - exactly this call's
// shape (see the forum thread: https://discuss.ai.google.dev/t/sustained-outage-14h-gemini-3-5-flash-generatecontent-hangs-indefinitely-on-structured-output-thinkingconfig-returns-0-bytes/174959).
// gemini-3.1-flash-lite doesn't hit it, so it's the one-shot fallback
// below rather than a second try on the same broken model.
const FALLBACK_MODEL = "gemini-3.1-flash-lite";

const GEMINI_TIMEOUT_MS = 20_000;

function geminiEndpoint(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

// Wraps a single Gemini call with a hard client-side timeout. Needed
// because of the 0-byte hang described above - without an AbortController
// here, a hung request would ride out the platform's own function
// timeout instead of failing in a way this code can react to (i.e. by
// trying the fallback model).
async function callGemini(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ ok: true; res: Response } | { ok: false; timedOut: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetch(geminiEndpoint(model), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Header, not a query param - query strings are far more likely
        // to end up logged somewhere between here and Google.
        "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          // Default thinkingLevel "medium" draws from this same token
          // budget and can truncate the real JSON mid-object. Minimized
          // since this is fact extraction, not reasoning; the generous
          // ceiling below is backup, since "minimal" isn't a hard zero.
          thinkingConfig: { thinkingLevel: "minimal" },
          maxOutputTokens: 4096,
          // responseSchema is a best-effort second layer on top of
          // responseMimeType; parseGenerated below still validates too.
          responseMimeType: "application/json",
          responseSchema: GENERATION_RESPONSE_SCHEMA,
        },
      }),
      signal: controller.signal,
    });
    return { ok: true, res };
  } catch (e) {
    return { ok: false, timedOut: e instanceof Error && e.name === "AbortError" };
  } finally {
    clearTimeout(timer);
  }
}

// Limits how much note text gets sent, so a topic with 40 subtopic notes
// can't turn one click into a huge request. The text is just cut short,
// not summarized - summarizing would need its own model call.
const MAX_NOTES_CHARS = 12000;

export type GenerateResult =
  | { ok: true; drafts: GeneratedQuestion[] }
  | { ok: false; message: string };

export async function generateQuestionDrafts(
  topicId: string,
  count: number,
  requestedTypes: string[]
): Promise<GenerateResult> {
  // Checked first: a missing key means this deployment can't generate
  // anything regardless of the notes. Usually a forgotten Vercel env
  // var, where "try again" would be bad advice.
  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, message: NOT_CONFIGURED_MESSAGE };
  }

  const supabase = await createClient();

  const { data: topic, error: topicErr } = await supabase
    .from("topics")
    .select("name")
    .eq("id", topicId)
    .single();
  // This shouldn't really happen, since the page itself already shows a
  // 404 for a missing topic. So this just throws and shows the app's
  // generic error page instead of a friendly message.
  if (topicErr || !topic) throw new Error("Topic not found.");

  // Two separate queries instead of one combined query, same choice
  // lib/weak-topics.ts makes for getTopicAccuracy: simpler to test.
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

  // File-only notes (content null) get skipped, not errored - there's no
  // text-extraction step for uploads in this feature. A topic that's all
  // files falls through to the "no usable content" check below.
  const usableNotes = [...(topicNotes ?? []), ...subtopicNotes].filter(
    (n) => n.content && n.content.trim().length > 0
  );

  if (usableNotes.length === 0) {
    return {
      ok: false,
      message:
        "This topic has no usable note content yet - add some notes (or notes with text, not just file attachments) before generating questions.",
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

  // Checked right before the Gemini call, not earlier - no point spending
  // this query on a request that was always going to bail on "no notes."
  // One shared GEMINI_API_KEY means the cap is app-wide, not per-user.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: callsToday, error: capErr } = await supabase
    .from("ai_generation_log")
    .select("id", { count: "exact", head: true })
    .gte("called_at", since);
  if (capErr) {
    // If this check itself breaks, generation is still allowed to
    // continue - blocking everyone because of a broken check is worse
    // than occasionally letting the real cap slip by a call or two.
    console.error("ai_generation_log count check failed", capErr);
  } else if (isOverDailyCap(callsToday ?? 0)) {
    return { ok: false, message: USAGE_CAPPED_MESSAGE };
  }

  // Logged as an attempt, not a success - even a Gemini-rejected call
  // (429/5xx) still hit the shared key, so undercounting would defeat
  // the cap. Errors are swallowed since a logging failure shouldn't
  // block generation the cap check already approved.
  const { error: logErr } = await supabase.from("ai_generation_log").insert({});
  if (logErr) console.error("ai_generation_log insert failed", logErr);

  const { systemPrompt, userPrompt } = buildGenerationPrompt({
    topicName: topic.name,
    notesText,
    count: n,
    types,
    existingPrompts,
  });

  // Tries PRIMARY_MODEL first, and falls back once to FALLBACK_MODEL if
  // it times out (the 0-byte hang bug) or Gemini's own side errors
  // (5xx) - both are model-specific incidents, not something a second
  // attempt against the same model would fix.
  let attempt = await callGemini(PRIMARY_MODEL, systemPrompt, userPrompt);
  let usedFallback = false;
  if (!attempt.ok || (attempt.ok && attempt.res.status >= 500)) {
    if (!attempt.ok) {
      console.error(
        `Gemini call to ${PRIMARY_MODEL} failed`,
        attempt.timedOut ? "timed out" : "network error"
      );
    } else {
      console.error(`Gemini call to ${PRIMARY_MODEL} returned`, attempt.res.status);
    }
    usedFallback = true;
    attempt = await callGemini(FALLBACK_MODEL, systemPrompt, userPrompt);
  }

  if (!attempt.ok) {
    // Neither model reached Google in time - could be a real network
    // problem, or (as of Jul 2026) the gemini-3.5-flash hang bug taking
    // the fallback down with it during a wider outage. This runs
    // server-side, so "check your connection" would blame the wrong machine.
    return {
      ok: false,
      message: attempt.timedOut
        ? "Gemini didn't respond in time - try again in a moment."
        : "Couldn't reach Gemini right now - try again in a moment.",
    };
  }

  const res = attempt.res;
  if (!res.ok) {
    // Real status goes to the server log; the user gets a mapped,
    // actionable line. A 429 is the free-tier rate limit - never suggest
    // billing, since that removes the free tier rather than raising the limit.
    console.error(
      `Gemini API error (${usedFallback ? FALLBACK_MODEL : PRIMARY_MODEL})`,
      res.status,
      await res.text().catch(() => "")
    );
    return { ok: false, message: classifyGeminiError(res.status) };
  }

  const body = await res.json();
  const text: string =
    body.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";

  if (!text) {
    // An empty response usually means Gemini blocked it (a safety
    // filter), not that it broke - "try again" is good advice here,
    // unlike for a broken-JSON failure.
    return {
      ok: false,
      message: "Gemini didn't return anything usable - try again or adjust your notes.",
    };
  }

  // parseGenerated throws if the text isn't valid JSON or isn't a list.
  // Caught here so it turns into the same result shape as every other
  // expected failure above, instead of an error Next.js would hide.
  let parsed: GeneratedQuestion[];
  try {
    parsed = parseGenerated(text);
  } catch (e) {
    // Logged raw (truncated) so the next parse failure is a one-line
    // diagnosis - this exact gap slowed down the thinking-token bug.
    console.error("Gemini response failed to parse:", text.slice(0, 2000));
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

  // Re-validated even though parseGenerated already checked once - the
  // review UI lets a user edit any field, including turning a valid MCQ
  // answer into one that no longer matches its options.
  const valid = drafts
    .map((d) => ({
      ...d,
      prompt: d.prompt.trim(),
      answer: d.answer.trim(),
      options: d.options ? d.options.map((o) => o.trim()) : null,
    }))
    .filter(isValidDraft);

  if (valid.length === 0) {
    return { ok: false, message: "None of the selected questions passed validation - edit and try again." };
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
