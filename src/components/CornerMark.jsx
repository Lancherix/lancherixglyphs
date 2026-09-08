export default function CornerMark({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="corner-mark"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="7.6" cy="7.6" r="2.6" fill="currentColor" />
    </svg>
  );
}
