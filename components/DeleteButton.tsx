"use client";

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
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        {label}
      </button>
    </form>
  );
}