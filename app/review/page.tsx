// The page that shows questions due for review today.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDueReviews } from "./actions";
import ReviewSession from "./review-session";
import EmptyState from "@/components/empty-state";

export default async function ReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const due = await getDueReviews();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold text-ink">Review</h1>
      
      {due.length === 0 ? (
        <EmptyState
          message="You're all caught up! Take a quiz to add questions to your review schedule."
          actionLabel="Explore modules"
          actionHref="/modules"
        />
      ) : (
        <>
          <p className="mb-6 text-sm text-muted">
            {due.length} question{due.length === 1 ? "" : "s"} due for review.
          </p>
          <ReviewSession initialQueue={due} />
        </>
      )}
    </main>
  );
}