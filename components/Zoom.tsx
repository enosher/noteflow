"use client";

import { useState } from "react";
import { FlowMark } from "./FlowMark";

// Clicking on the icon gives zoomed in version.
// For users to admire the logo closely :)
export function Zoom() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md transition-opacity hover:opacity-80"
        aria-label="View NoteFlow logo enlarged"
      >
        <FlowMark size={28} />
      </button>

      {open && (
        // Backdrop click to close it
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="rounded-2xl bg-[#1C1B1A] p-10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <FlowMark size={220} />
          </div>
        </div>
      )}
    </>
  );
}