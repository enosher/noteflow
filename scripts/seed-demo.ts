// scripts/seed-demo.ts
//
// Fills the shared demo account with sample data, so a visitor's first
// screen looks like a working product, not an empty one. Safe to run
// again: it wipes the demo user's modules first, then rebuilds them.
// Run with:
//   npx tsx scripts/seed-demo.ts
//
// Uses the service-role key, so RLS is bypassed - this script must only
// ever run locally against .env.local, never ship to the client bundle.

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEMO = process.env.DEMO_USER_ID!;

if (!url || !serviceKey || !DEMO) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DEMO_USER_ID');
  process.exit(1);
}

const db = createClient(url, serviceKey);

// Attempt history has to span weeks - same-day timestamps would collapse
// every recency factor to one value and make the breakdown look fake.
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

async function main() {
  // Start clean. Cascades take out topics/notes/questions/attempts.
  await db.from('modules').delete().eq('user_id', DEMO);

  // CS2030S: the "story" module - one strong topic, one weak
  const { data: cs2030, error: e1 } = await db
    .from('modules')
    .insert({
      user_id: DEMO,
      code: 'CS2030S',
      name: 'Programming Methodology II',
      description: 'OOP, generics, streams. Demo module with quiz history.',
    })
    .select()
    .single();
  if (e1) throw e1;

  const { data: topics, error: e2 } = await db
    .from('topics')
    .insert([
      { module_id: cs2030.id, name: 'Inheritance', order_index: 0 },
      { module_id: cs2030.id, name: 'Polymorphism', order_index: 1 },
      { module_id: cs2030.id, name: 'Recursion', order_index: 2 },
      { module_id: cs2030.id, name: 'Streams', order_index: 3 },
    ])
    .select();
  if (e2) throw e2;

  const t = Object.fromEntries(topics.map((x) => [x.name, x.id]));

  await db.from('notes').insert([
    {
      topic_id: t['Inheritance'],
      title: 'Inheritance basics',
      content:
        '# Inheritance\n\nA subclass `extends` a superclass, inheriting fields and methods.\n\n- `super()` must be the first statement in a subclass constructor\n- Java is single-inheritance for classes, multiple for interfaces\n- Prefer composition when the relationship is "has-a", not "is-a"',
    },
    {
      topic_id: t['Recursion'],
      title: 'Recursion patterns',
      content:
        '# Recursion\n\nEvery recursive method needs:\n\n1. **Base case** - terminates without recursing\n2. **Recursive case** - reduces towards the base case\n\nStack depth is bounded by JVM stack size; prefer tail-recursive shapes or iteration for deep inputs.',
    },
  ]);

  // Question bank. difficulty spread matters: the recommender's
  // difficulty_match term is only visible if difficulties differ.
  type Q = {
    topic: string;
    prompt: string;
    answer: string;
    question_type: 'mcq' | 'short_answer' | 'long_answer';
    options?: string[];
    difficulty: number;
  };
  const bank: Q[] = [
    { topic: 'Inheritance', prompt: 'Which keyword lets a subclass call its parent constructor?', answer: 'super', question_type: 'short_answer', difficulty: 1 },
    { topic: 'Inheritance', prompt: 'Can a Java class extend two classes?', answer: 'B) No', question_type: 'mcq', options: ['A) Yes', 'B) No', 'C) Only if abstract', 'D) Only interfaces'], difficulty: 1 },
    { topic: 'Inheritance', prompt: 'Explain when composition is preferable to inheritance.', answer: 'When the relationship is has-a rather than is-a; composition avoids fragile base class problems and allows swapping implementations at runtime.', question_type: 'long_answer', difficulty: 3 },
    { topic: 'Polymorphism', prompt: 'What is dynamic binding?', answer: 'Method implementation chosen at runtime based on the actual object type', question_type: 'short_answer', difficulty: 2 },
    { topic: 'Polymorphism', prompt: 'Which method call is resolved at compile time?', answer: 'C) static methods', question_type: 'mcq', options: ['A) overridden methods', 'B) abstract methods', 'C) static methods', 'D) interface default methods'], difficulty: 3 },
    { topic: 'Recursion', prompt: 'What two parts must every recursive method have?', answer: 'A base case and a recursive case that progresses towards it', question_type: 'short_answer', difficulty: 2 },
    { topic: 'Recursion', prompt: 'What happens when recursion has no reachable base case?', answer: 'A) StackOverflowError', question_type: 'mcq', options: ['A) StackOverflowError', 'B) Infinite loop, no error', 'C) OutOfMemoryError', 'D) Compile error'], difficulty: 2 },
    { topic: 'Recursion', prompt: 'Convert an iterative sum over an array into a recursive method and state its space complexity.', answer: 'Recurse over index; O(n) stack space unless tail-call optimised (which the JVM does not do).', question_type: 'long_answer', difficulty: 4 },
    { topic: 'Streams', prompt: 'Which operation is terminal: map, filter, or reduce?', answer: 'reduce', question_type: 'short_answer', difficulty: 2 },
    { topic: 'Streams', prompt: 'Are Java streams reusable after a terminal operation?', answer: 'B) No', question_type: 'mcq', options: ['A) Yes', 'B) No', 'C) Only parallel streams', 'D) Only if boxed'], difficulty: 3 },
  ];

  const { data: questions, error: e3 } = await db
    .from('questions')
    .insert(
      bank.map((q) => ({
        topic_id: t[q.topic],
        prompt: q.prompt,
        answer: q.answer,
        question_type: q.question_type,
        options: q.options ?? null,
        difficulty: q.difficulty,
      }))
    )
    .select();
  if (e3) throw e3;

  // Attempt history is what makes Track and Adapt come alive: Recursion
  // lands ~40% accuracy to clear the weak-topic gate, Inheritance lands
  // strong, and timestamps spread over ~3 weeks so recency terms diverge.
  const byPrompt = Object.fromEntries(questions.map((q) => [q.prompt, q]));
  const attempt = (
    prompt: string,
    correct: boolean,
    days: number,
    ms = 20000
  ) => ({
    user_id: DEMO,
    question_id: byPrompt[prompt].id,
    user_answer: correct ? byPrompt[prompt].answer : 'wrong answer',
    is_correct: correct,
    time_taken_ms: ms,
    attempted_at: daysAgo(days),
  });

  const attempts = [
    // Inheritance: 5/6 correct → strong topic
    attempt('Which keyword lets a subclass call its parent constructor?', true, 20),
    attempt('Which keyword lets a subclass call its parent constructor?', true, 12),
    attempt('Can a Java class extend two classes?', true, 20),
    attempt('Can a Java class extend two classes?', true, 5),
    attempt('Explain when composition is preferable to inheritance.', true, 12),
    attempt('Explain when composition is preferable to inheritance.', false, 21),
    // Polymorphism: 2/4 → borderline, sits near threshold (nice demo of the boundary)
    attempt('What is dynamic binding?', true, 15),
    attempt('What is dynamic binding?', false, 8),
    attempt('Which method call is resolved at compile time?', false, 15),
    attempt('Which method call is resolved at compile time?', true, 2),
    // Recursion: 2/5 → clearly weak, with a recent mistake to trip mistake_recency
    attempt('What two parts must every recursive method have?', false, 18),
    attempt('What two parts must every recursive method have?', true, 10),
    attempt('What happens when recursion has no reachable base case?', false, 10),
    attempt('What happens when recursion has no reachable base case?', false, 1, 45000),
    attempt('Convert an iterative sum over an array into a recursive method and state its space complexity.', true, 6),
    // Streams: 1 attempt only → below the attempts>=3 gate, shows the gate working
    attempt('Which operation is terminal: map, filter, or reduce?', true, 3),
  ];

  const { error: e4 } = await db.from('quiz_attempts').insert(attempts);
  if (e4) throw e4;

  // Concept graph edges. Inheritance -> Polymorphism and Recursion ->
  // Streams, so the graph shows real structure - and since Recursion is
  // seeded weak, Streams demos the "gated behind a weak prerequisite"
  // state without any manual setup.
  const { error: e6 } = await db.from('topic_prerequisites').insert([
    { topic_id: t['Polymorphism'], prerequisite_topic_id: t['Inheritance'] },
    { topic_id: t['Streams'], prerequisite_topic_id: t['Recursion'] },
  ]);
  if (e6) throw e6;

  // SM-2 queue. Without these rows /review opens on "all caught up",
  // which demos the headline feature as empty. States mirror what real
  // grading would have produced: new cards (0 reps), learning cards
  // (1-2 reps), and one mature card - all due now or overdue so the
  // session has a visible queue.
  const due = (
    prompt: string,
    reps: number,
    ease: number,
    interval: number,
    overdueDays: number
  ) => ({
    user_id: DEMO,
    question_id: byPrompt[prompt].id,
    repetitions: reps,
    ease_factor: ease,
    interval_days: interval,
    due_at: daysAgo(overdueDays),
    last_reviewed_at: reps > 0 ? daysAgo(overdueDays + interval) : null,
  });

  const { error: e7 } = await db.from('review_schedule').insert([
    due('What two parts must every recursive method have?', 1, 2.18, 1, 2),
    due('What happens when recursion has no reachable base case?', 0, 2.5, 0, 1),
    due('Which method call is resolved at compile time?', 1, 2.36, 1, 0),
    due('What is dynamic binding?', 2, 2.5, 6, 1),
    due('Can a Java class extend two classes?', 3, 2.6, 15, 0),
    due('Which operation is terminal: map, filter, or reduce?', 0, 2.5, 0, 3),
  ]);
  if (e7) throw e7;

  // Second and third modules: thinner, just so the sidebar isn't lonely
  const { data: others, error: e5 } = await db
    .from('modules')
    .insert([
      { user_id: DEMO, code: 'MA1521', name: 'Calculus for Computing', description: 'Limits, derivatives, integrals.' },
      { user_id: DEMO, code: 'ST2334', name: 'Probability and Statistics', description: 'Random variables, distributions.' },
    ])
    .select();
  if (e5) throw e5;

  for (const m of others) {
    await db.from('topics').insert([
      { module_id: m.id, name: 'Week 1 fundamentals', order_index: 0 },
      { module_id: m.id, name: 'Week 2 core concepts', order_index: 1 },
    ]);
  }

  console.log('Demo account seeded. Log in as demo@noteflow.app and check:');
  console.log('  - Dashboard: Recursion flagged weak, Inheritance strong');
  console.log('  - Recommendations: should surface a Recursion question');
  console.log('  - /review: 6 cards due, mixed SM-2 stages');
  console.log('  - CS2030S graph: 2 edges, Streams gated behind weak Recursion');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
