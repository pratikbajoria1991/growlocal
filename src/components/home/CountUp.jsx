"use client";
import { useEffect, useRef, useState } from "react";

export function CountUp({ to, suffix = "", duration = 1400 }) {
  const [n, setN] = useState(to); // server-rendered with the real number: correct without JS
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    setN(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        // rAF can stamp the first frame before t0; clamp so it never goes negative.
        const p = Math.min(1, Math.max(0, (t - t0) / duration));
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref} className="tabular-nums">{n}{suffix}</span>;
}
