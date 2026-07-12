"use client";

// A delete button that asks "are you sure?" before it does anything.
export function DeleteButton({
  action,
  confirmMessage = "Are you sure? This can't be undone.",
  label = "Delete",
}: {
  action: () => void;
  confirmMessage?: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-mastery-weak/10"
        style={{ borderColor: "var(--mastery-weak)", color: "var(--mastery-weak)" }}
      >
        {label}
      </button>
    </form>
  );
}