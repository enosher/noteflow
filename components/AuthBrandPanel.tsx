// The dark brand panel shown on the left of login/signup (desktop only).
// Shared so both auth pages carry the same visual identity - only the
// headline copy changes between them.
//
// Texture is a faint ruled grid (graph paper / notebook lines) rather
// than a glowing gradient orb - the latter is the generic "dark SaaS
// hero" default; a grid is literally what students take notes on, so
// it's tied to the actual subject instead of borrowed from elsewhere.
import { FlowMark } from "./FlowMark";
import { GraphMotif } from "./GraphMotif";

export function AuthBrandPanel({
  headline,
  subtext,
  caption = "Your knowledge, mapped.",
}: {
  headline: string;
  subtext: string;
  caption?: string;
}) {
  return (
    <div
      className="relative hidden flex-col justify-between overflow-hidden bg-[#14151C] p-12 text-[#EDE8DF] lg:flex"
    >
      {/* ruled grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#EDE8DF 1px, transparent 1px), linear-gradient(90deg, #EDE8DF 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      {/* oversized watermark logo, part of the background texture */}
      <div className="pointer-events-none absolute -bottom-48 -right-48 opacity-[0.07]">
        <FlowMark size={820} />
      </div>

      <div className="relative flex items-center gap-4">
        <FlowMark size={72} />
        <span className="font-display text-2xl font-semibold tracking-tight">
          NoteFlow
        </span>
      </div>

      <div className="relative max-w-md">
        <p className="font-display text-[2.6rem] font-medium leading-[1.1]">
          {headline}
        </p>
        <p className="mt-5 text-[15px] leading-relaxed text-[#EDE8DF]/50">
          {subtext}
        </p>
      </div>

      <div className="relative flex items-end justify-between border-t border-[#EDE8DF]/10 pt-6">
        <div className="h-28 w-full max-w-[220px]">
          <GraphMotif />
        </div>
        <p className="pb-1 text-xs text-[#EDE8DF]/35">{caption}</p>
      </div>
    </div>
  );
}
