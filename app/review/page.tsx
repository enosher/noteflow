import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDueReviews } from "./actions";
import ReviewSession from "./review-session";

export default async function ReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const due = await getDueReviews();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">Review</h1>
      <p className="mt-1 text-sm text-muted">
        {due.length === 0
          ? "Nothing due — answering quiz questions schedules them for review at growing intervals."
          : `${due.length} question${due.length === 1 ? "" : "s"} due for review.`}
      </p>
      {due.length > 0 && <ReviewSession initialQueue={due} />}
    </main>
  );
}