/** Green verified tick shown next to names. Every Learn Islam user gets it, free, for life. */
export default function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <svg
      role="img" aria-label="Verified" viewBox="0 0 24 24" width={size} height={size}
      className="inline-block align-[-2px] ml-1 shrink-0"
    >
      <path
        fill="#16a34a"
        d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3 1 3-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3-1-3 2.6-1.9 1-3 3.2.1z"
      />
      <path d="M7.8 12.4l3 3 5.6-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
