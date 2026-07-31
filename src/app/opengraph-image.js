import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0b1a12",
          fontFamily: "sans-serif",
        }}
      >
        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#7ee23e", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 24, color: "#0b1a12", fontWeight: 800 }}>G</div>
          </div>
          <div style={{ fontSize: 30, color: "#fbfdfb", fontWeight: 600, letterSpacing: -0.5 }}>{BRAND.name}</div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, color: "#fbfdfb", lineHeight: 1.04, fontWeight: 700, letterSpacing: -2.5 }}>
            Get found on Google,
          </div>
          <div style={{ fontSize: 76, color: "#7ee23e", lineHeight: 1.04, fontWeight: 700, letterSpacing: -2.5 }}>
            Maps, and AI.
          </div>
        </div>

        {/* three surfaces */}
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { tag: "SEO", color: "#38bdf8" },
            { tag: "AEO", color: "#7ee23e" },
            { tag: "GEO", color: "#f59e0b" },
          ].map((s) => (
            <div
              key={s.tag}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 999,
                border: `1px solid ${s.color}55`,
                background: `${s.color}18`,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />
              <div style={{ fontSize: 22, color: s.color, fontWeight: 600 }}>{s.tag}</div>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 22, color: "rgba(251,253,251,0.4)", display: "flex", alignItems: "center" }}>
            Free website audit
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
