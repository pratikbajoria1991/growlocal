// Growlocal mark: a location pin whose inner shape is an upward growth arrow.
export function Logo({ className = "w-7 h-7" }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0b1a12" />
      <path
        d="M16 6.5c-3.6 0-6.5 2.9-6.5 6.5 0 4.6 6.5 12 6.5 12s6.5-7.4 6.5-12c0-3.6-2.9-6.5-6.5-6.5Z"
        stroke="#7ee23e"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13 14.5l2.2-2.6 1.9 1.9 2.6-3.2" stroke="#7ee23e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.7 10.6h-2.1M19.7 10.6v2.1" stroke="#7ee23e" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
