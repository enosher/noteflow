// Fisher-Yates, in place on a copy. Used to randomize quiz question order
// and MCQ option order per attempt - an M3 tester noticed the same
// question order (and the same answer position) on every retry and
// pointed out that a fixed order lets repeated practice turn into
// memorizing "the ABCs" instead of actually learning the material.
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
