"use client";

// A form submit button that shows a "pending" label while it's saving.
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
  className = "rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-hover",
}: {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-50`}>
      {pending ? pendingText : children}
    </button>
  );
}