// One deliberate entrance, done in CSS (no animation library in the bundle).
// Only plays when `enabled`; the reduced-motion media query in globals.css turns it off.
export function Reveal({ children, delay = 0, className = "", as: Tag = "div", enabled = false }) {
  return (
    <Tag className={`${enabled ? "fade-up" : ""} ${className}`.trim()} style={enabled && delay ? { animationDelay: `${delay}s` } : undefined}>
      {children}
    </Tag>
  );
}
