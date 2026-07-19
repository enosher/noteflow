// lib/seed-demo-data.ts
//
// The full demo narrative (CS2030S with a weak/strong topic split, graph
// edges, and an SM-2 review queue) shared between two callers:
//   - scripts/seed-demo.ts, run by hand with the service-role key
//   - resetDemoAccount() (app/login/demo-actions.ts), run automatically
//     on logout so the next visitor always sees the intended state
//
// Takes a Supabase client and a userId rather than assuming a specific
// client/credential shape, so either caller can pass whatever client
// (service-role or the caller's own authenticated session) they have.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

type Db = SupabaseClient<Database>;

// Attempt history has to span weeks - same-day timestamps would collapse
// every recency factor to one value and make the breakdown look fake.
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export async function seedDemoAccountData(db: Db, userId: string): Promise<void> {
  // Start clean. Cascades take out topics/notes/questions/attempts.
  await db.from('modules').delete().eq('user_id', userId);

  // CS2030S: the "story" module - one strong topic, one weak
  const { data: cs2030, error: e1 } = await db
    .from('modules')
    .insert({
      user_id: userId,
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
    // Polymorphism and Streams previously had no notes at all, so
    // "Generate questions" always failed there with "no usable note
    // content" - not a bug, just a data gap, but it's exactly what an
    // M3 tester hit. Same text as lib/seed-data.ts's CS2030S notes, kept
    // in sync since both seed the same module.
    {
      topic_id: t['Polymorphism'],
      title: 'Polymorphism basics',
      content:
        '# Polymorphism\n\nA subclass reference can be treated as its superclass type, and the correct overridden method is chosen at runtime (dynamic binding).\n\n- Overriding needs the same method signature; overloading needs a different one\n- `static` methods are resolved at compile time, so they are never overridden, only hidden\n- Interfaces give polymorphism without needing a class hierarchy',
    },
    {
      topic_id: t['Streams'],
      title: 'Streams basics',
      content:
        '# Streams\n\nA Stream is a pipeline of intermediate operations (`map`, `filter`) ending in exactly one terminal operation (`reduce`, `collect`, `forEach`).\n\n- Streams are lazy - nothing runs until a terminal operation is called\n- A stream can only be consumed once; reusing it throws `IllegalStateException`\n- Prefer `collect(Collectors.toList())` over manually building a list in a loop',
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
    user_id: userId,
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
    // Recursion: 2/5 → clearly weak, with its most recent attempt wrong so
    // mistake_recency trips too. Kept at 8 days (not <7) so recency_boost
    // also fires - otherwise a topic that's merely weak can lose the
    // recommendation slot to a less-weak topic whose last miss was more
    // recent, which defeats the point of this seed data.
    attempt('What two parts must every recursive method have?', false, 18),
    attempt('What two parts must every recursive method have?', true, 10),
    attempt('What happens when recursion has no reachable base case?', false, 10),
    attempt('What happens when recursion has no reachable base case?', false, 8, 45000),
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
    user_id: userId,
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
      { user_id: userId, code: 'MA1521', name: 'Calculus for Computing', description: 'Limits, derivatives, integrals.' },
      { user_id: userId, code: 'ST2334', name: 'Probability and Statistics', description: 'Random variables, distributions.' },
    ])
    .select();
  if (e5) throw e5;

  // "Thinner" on purpose (no questions/attempts, just topics), but each
  // topic still needs one real note - otherwise "Generate questions"
  // fails with "no usable note content" the moment anyone clicks into
  // one of these, same gap as CS2030S above.
  const otherNotes: Record<string, { title: string; content: string }[]> = {
    MA1521: [
      {
        title: 'Limits and continuity',
        content:
          "# Limits and continuity\n\n- A function is continuous at `a` if the limit as x approaches a equals f(a)\n- L'Hopital's rule only applies to 0/0 or infinity/infinity indeterminate forms\n- A removable discontinuity can often be fixed by redefining the function at a single point",
      },
      {
        title: 'Derivatives and integrals',
        content:
          '# Derivatives and integrals\n\n- The derivative is the instantaneous rate of change; the definite integral is the signed area under a curve\n- The Fundamental Theorem of Calculus links the two - differentiation and integration are inverse operations\n- Product rule, quotient rule, and chain rule cover most derivatives you will need',
      },
    ],
    ST2334: [
      {
        title: 'Random variables',
        content:
          '# Random variables\n\n- A discrete random variable takes countable values; a continuous one takes any value in a range\n- The expected value E[X] is the long-run average outcome\n- Variance measures spread: Var(X) = E[X^2] - (E[X])^2',
      },
      {
        title: 'Common distributions',
        content:
          '# Common distributions\n\n- Binomial: number of successes in n independent trials with a fixed success probability p\n- Normal: symmetric, bell-shaped, defined by its mean and standard deviation\n- The Central Limit Theorem is why the normal distribution shows up so often, even for non-normal underlying data',
      },
    ],
  };

  for (const m of others) {
    const { data: otherTopics, error: eOtherTopics } = await db
      .from('topics')
      .insert([
        { module_id: m.id, name: 'Week 1 fundamentals', order_index: 0 },
        { module_id: m.id, name: 'Week 2 core concepts', order_index: 1 },
      ])
      .select();
    if (eOtherTopics) throw eOtherTopics;

    const notesForModule = otherNotes[m.code] ?? [];
    const { error: eOtherNotes } = await db.from('notes').insert([
      { topic_id: otherTopics[0].id, title: notesForModule[0].title, content: notesForModule[0].content },
      { topic_id: otherTopics[1].id, title: notesForModule[1].title, content: notesForModule[1].content },
    ]);
    if (eOtherNotes) throw eOtherNotes;
  }
}
