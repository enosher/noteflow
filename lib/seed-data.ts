// lib/seed-data.ts
//
// The sample data used to fill a new account so it isn't empty. Used by
// both scripts/seed-all.ts and the "Load sample data" button.
//
// Two modules on purpose: CS2030S reads as a CS student's account,
// GEA1000 (NUS's common quant-reasoning module) reads as anyone else's,
// so the app doesn't look computing-only to a non-CS evaluator.
//
// Safe to run more than once: seedAccountData() only adds module codes
// the account doesn't already have, so re-running it never duplicates
// or deletes anything.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

type Db = SupabaseClient<Database>;

type SeedQuestion = {
  topic: string;
  prompt: string;
  answer: string;
  question_type: 'mcq' | 'short_answer' | 'long_answer';
  options?: string[];
  difficulty: number;
};

type SeedAttempt = {
  prompt: string;
  correct: boolean;
  daysAgo: number;
  ms?: number;
};

type SeedTopic = { name: string; order_index: number };

type SeedNote = { topic: string; title: string; content: string };

type SeedModule = {
  code: string;
  name: string;
  description: string;
  topics: SeedTopic[];
  notes: SeedNote[];
  questions: SeedQuestion[];
  attempts: SeedAttempt[];
};

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export const SEED_MODULES: SeedModule[] = [
  {
    code: 'CS2030S',
    name: 'Programming Methodology II',
    description: 'OOP, generics, streams. Sample module with quiz history.',
    topics: [
      { name: 'Inheritance', order_index: 0 },
      { name: 'Polymorphism', order_index: 1 },
      { name: 'Recursion', order_index: 2 },
      { name: 'Streams', order_index: 3 },
    ],
    notes: [
      {
        topic: 'Inheritance',
        title: 'Inheritance basics',
        content:
          '# Inheritance\n\nA subclass `extends` a superclass, inheriting fields and methods.\n\n- `super()` must be the first statement in a subclass constructor\n- Java is single-inheritance for classes, multiple for interfaces\n- Prefer composition when the relationship is "has-a", not "is-a"',
      },
      {
        topic: 'Recursion',
        title: 'Recursion patterns',
        content:
          '# Recursion\n\nEvery recursive method needs:\n\n1. **Base case** - terminates without recursing\n2. **Recursive case** - reduces towards the base case\n\nStack depth is bounded by JVM stack size; prefer tail-recursive shapes or iteration for deep inputs.',
      },
    ],
    questions: [
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
    ],
    attempts: [
      { prompt: 'Which keyword lets a subclass call its parent constructor?', correct: true, daysAgo: 20 },
      { prompt: 'Which keyword lets a subclass call its parent constructor?', correct: true, daysAgo: 12 },
      { prompt: 'Can a Java class extend two classes?', correct: true, daysAgo: 20 },
      { prompt: 'Can a Java class extend two classes?', correct: true, daysAgo: 5 },
      { prompt: 'Explain when composition is preferable to inheritance.', correct: true, daysAgo: 12 },
      { prompt: 'Explain when composition is preferable to inheritance.', correct: false, daysAgo: 21 },
      { prompt: 'What is dynamic binding?', correct: true, daysAgo: 15 },
      { prompt: 'What is dynamic binding?', correct: false, daysAgo: 8 },
      { prompt: 'Which method call is resolved at compile time?', correct: false, daysAgo: 15 },
      { prompt: 'Which method call is resolved at compile time?', correct: true, daysAgo: 2 },
      { prompt: 'What two parts must every recursive method have?', correct: false, daysAgo: 18 },
      { prompt: 'What two parts must every recursive method have?', correct: true, daysAgo: 10 },
      { prompt: 'What happens when recursion has no reachable base case?', correct: false, daysAgo: 10 },
      { prompt: 'What happens when recursion has no reachable base case?', correct: false, daysAgo: 1, ms: 45000 },
      { prompt: 'Convert an iterative sum over an array into a recursive method and state its space complexity.', correct: true, daysAgo: 6 },
      { prompt: 'Which operation is terminal: map, filter, or reduce?', correct: true, daysAgo: 3 },
    ],
  },
  {
    code: 'GEA1000',
    name: 'Quantitative Reasoning',
    description:
      'Descriptive stats, probability, and reading data critically. Sample module for non-CS students.',
    topics: [
      { name: 'Descriptive Statistics', order_index: 0 },
      { name: 'Probability Basics', order_index: 1 },
      { name: 'Data Visualization Fallacies', order_index: 2 },
      { name: 'Correlation vs Causation', order_index: 3 },
    ],
    notes: [
      {
        topic: 'Descriptive Statistics',
        title: 'Mean, median, mode',
        content:
          '# Descriptive statistics\n\n- **Mean** - sensitive to outliers\n- **Median** - the middle value; robust to outliers\n- **Mode** - most frequent value; only measure that works on categorical data\n\nStandard deviation uses every point, so it is a better spread measure than range.',
      },
      {
        topic: 'Data Visualization Fallacies',
        title: 'Charts that lie',
        content:
          '# Reading charts critically\n\nCommon tricks: truncated y-axes exaggerate small differences; dual axes with mismatched scales can imply a false relationship; pie charts that do not sum to 100% are a red flag.',
      },
    ],
    questions: [
      { topic: 'Descriptive Statistics', prompt: 'Which measure of central tendency is most affected by outliers?', answer: 'mean', question_type: 'short_answer', difficulty: 1 },
      { topic: 'Descriptive Statistics', prompt: 'The median of a dataset is best described as:', answer: 'B) The middle value when sorted', question_type: 'mcq', options: ['A) The most frequent value', 'B) The middle value when sorted', 'C) The average of all values', 'D) The range of values'], difficulty: 1 },
      { topic: 'Descriptive Statistics', prompt: 'Explain why standard deviation is preferred over range as a measure of spread.', answer: 'Standard deviation uses every data point and reflects how tightly values cluster around the mean, while range only considers the two extreme values and is highly sensitive to outliers.', question_type: 'long_answer', difficulty: 3 },
      { topic: 'Probability Basics', prompt: 'What is the probability of two independent events both occurring, in terms of their individual probabilities?', answer: 'The product of their individual probabilities', question_type: 'short_answer', difficulty: 2 },
      { topic: 'Probability Basics', prompt: 'If P(A)=0.3 and P(B)=0.4 and A, B are independent, what is P(A and B)?', answer: 'B) 0.12', question_type: 'mcq', options: ['A) 0.7', 'B) 0.12', 'C) 0.1', 'D) 1.2'], difficulty: 3 },
      { topic: 'Probability Basics', prompt: 'Explain the difference between independent and mutually exclusive events.', answer: "Independent events do not affect each other's probability of occurring; mutually exclusive events cannot both occur at the same time. Two events with nonzero probability cannot be both independent and mutually exclusive.", question_type: 'long_answer', difficulty: 3 },
      { topic: 'Data Visualization Fallacies', prompt: 'What visual trick makes small differences look dramatic on a bar chart?', answer: 'Truncating the y-axis', question_type: 'short_answer', difficulty: 2 },
      { topic: 'Data Visualization Fallacies', prompt: 'A pie chart with slices summing to 120% is an example of:', answer: 'B) A misleading or erroneous chart', question_type: 'mcq', options: ['A) Correct data if rounded', 'B) A misleading or erroneous chart', 'C) A 3D projection effect', 'D) Normal statistical variance'], difficulty: 2 },
      { topic: 'Data Visualization Fallacies', prompt: 'Describe how a dual-axis chart can be used to mislead a reader, and how to check for it.', answer: 'By choosing different scales for the two y-axes, two unrelated trends can be made to look correlated or one exaggerated relative to the other; check whether both axes start at zero and use comparable scales.', question_type: 'long_answer', difficulty: 4 },
      { topic: 'Correlation vs Causation', prompt: 'Ice cream sales and drowning deaths are correlated. The most likely explanation is:', answer: 'C) A confounding variable (hot weather) drives both', question_type: 'mcq', options: ['A) Ice cream causes drowning', 'B) Drowning causes ice cream sales', 'C) A confounding variable (hot weather) drives both', 'D) The correlation is fabricated'], difficulty: 2 },
      { topic: 'Correlation vs Causation', prompt: 'What term describes a variable that influences two other variables, creating a spurious correlation between them?', answer: 'Confounding variable', question_type: 'short_answer', difficulty: 1 },
    ],
    attempts: [
      { prompt: 'Which measure of central tendency is most affected by outliers?', correct: true, daysAgo: 19 },
      { prompt: 'Which measure of central tendency is most affected by outliers?', correct: true, daysAgo: 11 },
      { prompt: 'The median of a dataset is best described as:', correct: true, daysAgo: 19 },
      { prompt: 'The median of a dataset is best described as:', correct: true, daysAgo: 4 },
      { prompt: 'Explain why standard deviation is preferred over range as a measure of spread.', correct: true, daysAgo: 11 },
      { prompt: 'Explain why standard deviation is preferred over range as a measure of spread.', correct: false, daysAgo: 20 },
      { prompt: 'What is the probability of two independent events both occurring, in terms of their individual probabilities?', correct: true, daysAgo: 14 },
      { prompt: 'What is the probability of two independent events both occurring, in terms of their individual probabilities?', correct: false, daysAgo: 7 },
      { prompt: 'If P(A)=0.3 and P(B)=0.4 and A, B are independent, what is P(A and B)?', correct: false, daysAgo: 14 },
      { prompt: 'If P(A)=0.3 and P(B)=0.4 and A, B are independent, what is P(A and B)?', correct: true, daysAgo: 1 },
      { prompt: 'What visual trick makes small differences look dramatic on a bar chart?', correct: false, daysAgo: 17 },
      { prompt: 'What visual trick makes small differences look dramatic on a bar chart?', correct: true, daysAgo: 9 },
      { prompt: 'A pie chart with slices summing to 120% is an example of:', correct: false, daysAgo: 9 },
      { prompt: 'A pie chart with slices summing to 120% is an example of:', correct: false, daysAgo: 1, ms: 42000 },
      { prompt: 'Describe how a dual-axis chart can be used to mislead a reader, and how to check for it.', correct: true, daysAgo: 5 },
      { prompt: 'Ice cream sales and drowning deaths are correlated. The most likely explanation is:', correct: true, daysAgo: 2 },
    ],
  },
];

export type SeedResult = {
  seededCodes: string[];
  skippedCodes: string[];
};

// Seeds SEED_MODULES into one account. Works with an authenticated user
// client or a service-role client - every row carries userId explicitly,
// so the insert shape doesn't change based on caller.
//
// Never deletes anything. A code the account already has is left alone,
// which is what makes it safe to run against real accounts, repeatedly.
export async function seedAccountData(
  db: Db,
  userId: string
): Promise<SeedResult> {
  const { data: existing, error: existingErr } = await db
    .from('modules')
    .select('code')
    .eq('user_id', userId)
    .in(
      'code',
      SEED_MODULES.map((m) => m.code)
    );
  if (existingErr) throw existingErr;

  const existingCodes = new Set((existing ?? []).map((m) => m.code));
  const toSeed = SEED_MODULES.filter((m) => !existingCodes.has(m.code));

  for (const mod of toSeed) {
    const { data: moduleRow, error: modErr } = await db
      .from('modules')
      .insert({
        user_id: userId,
        code: mod.code,
        name: mod.name,
        description: mod.description,
      })
      .select()
      .single();
    if (modErr) throw modErr;

    const { data: topicRows, error: topicErr } = await db
      .from('topics')
      .insert(
        mod.topics.map((t) => ({
          module_id: moduleRow.id,
          name: t.name,
          order_index: t.order_index,
        }))
      )
      .select();
    if (topicErr) throw topicErr;

    const topicIdByName = Object.fromEntries(
      topicRows.map((t) => [t.name, t.id])
    );

    if (mod.notes.length > 0) {
      const { error: noteErr } = await db.from('notes').insert(
        mod.notes.map((n) => ({
          topic_id: topicIdByName[n.topic],
          title: n.title,
          content: n.content,
        }))
      );
      if (noteErr) throw noteErr;
    }

    const { data: questionRows, error: qErr } = await db
      .from('questions')
      .insert(
        mod.questions.map((q) => ({
          topic_id: topicIdByName[q.topic],
          prompt: q.prompt,
          answer: q.answer,
          question_type: q.question_type,
          options: q.options ?? null,
          difficulty: q.difficulty,
        }))
      )
      .select();
    if (qErr) throw qErr;

    const questionByPrompt = Object.fromEntries(
      questionRows.map((q) => [q.prompt, q])
    );

    const attemptRows = mod.attempts.map((a) => {
      const question = questionByPrompt[a.prompt];
      return {
        user_id: userId,
        question_id: question.id,
        user_answer: a.correct ? question.answer : 'wrong answer',
        is_correct: a.correct,
        time_taken_ms: a.ms ?? 20000,
        attempted_at: daysAgo(a.daysAgo),
      };
    });

    const { error: attemptErr } = await db
      .from('quiz_attempts')
      .insert(attemptRows);
    if (attemptErr) throw attemptErr;
  }

  return {
    seededCodes: toSeed.map((m) => m.code),
    skippedCodes: SEED_MODULES.filter((m) => existingCodes.has(m.code)).map(
      (m) => m.code
    ),
  };
}
