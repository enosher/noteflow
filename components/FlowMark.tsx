// Brand mark: a single flowing line through a rounded square — "notes
// flowing into mastery." One home for it so it's reused everywhere the
// wordmark shows up (nav now, login/signup later if wanted).
export function FlowMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect width="22" height="22" rx="6" fill="#0F6B66" />
      <path
        d="M5 14c2-4.5 4-4.5 5.5-2s3.5 2 6.5-2"
        stroke="#E4F0EE"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}