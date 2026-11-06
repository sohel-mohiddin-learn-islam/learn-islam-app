import type { CSSProperties } from "react";
import type { Overlay } from "@/lib/storyTools";

export function overlayStyle(o: Overlay): { className: string; style: CSSProperties } {
  const size = `${o.scale * 6}cqw`;
  const base: CSSProperties = { fontSize: size, lineHeight: 1.2, color: o.color, textAlign: "center", whiteSpace: "pre-wrap", maxWidth: "88cqw" };
  if (o.kind === "mention") {
    return { className: "rounded-lg px-3 py-1 font-bold bg-white", style: { ...base, color: "#7c3aed", fontSize: `${o.scale * 5}cqw` } };
  }
  if (o.kind === "sticker") {
    if (o.style === "emoji") return { className: "", style: { ...base, fontSize: `${o.scale * 16}cqw` } };
    if (o.style === "pill") return { className: "rounded-full px-4 py-2 font-bold bg-white", style: { ...base, color: "#111", fontSize: `${o.scale * 5}cqw` } };
    // gold arabic calligraphy
    return {
      className: "font-bold",
      style: { ...base, fontFamily: "'Amiri','Noto Naskh Arabic',serif", fontSize: `${o.scale * 9}cqw`, color: "#fcd34d", textShadow: "0 2px 8px rgba(0,0,0,.8)" },
    };
  }
  switch (o.style) {
    case "bold": return { className: "font-black uppercase tracking-wide", style: { ...base, textShadow: "0 2px 6px rgba(0,0,0,.7)" } };
    case "typewriter": return { className: "font-mono px-2 rounded", style: { ...base, background: "rgba(255,255,255,.92)", color: "#111" } };
    case "neon": return { className: "font-bold", style: { ...base, textShadow: `0 0 6px ${o.color}, 0 0 14px ${o.color}, 0 0 28px ${o.color}`, color: "#fff" } };
    case "serif": return { className: "italic", style: { ...base, fontFamily: "Georgia, 'Times New Roman', serif", textShadow: "0 2px 6px rgba(0,0,0,.7)" } };
    case "box": return { className: "font-bold px-3 py-1 rounded-lg", style: { ...base, background: o.color, color: o.color === "#ffffff" || o.color === "#facc15" ? "#111" : "#fff" } };
    case "arabic": return { className: "font-bold", style: { ...base, fontFamily: "'Amiri','Noto Naskh Arabic',serif", fontSize: `${o.scale * 8}cqw`, textShadow: "0 2px 8px rgba(0,0,0,.8)" } };
    default: return { className: "font-semibold", style: { ...base, textShadow: "0 2px 6px rgba(0,0,0,.8)" } };
  }
}

/** Read-only overlays on top of a story (used in the viewer). */
export default function OverlayLayer({ overlays, onMention }: { overlays: Overlay[]; onMention?: (uid: string) => void }) {
  return (
    <>
      {overlays.map((o) => {
        const s = overlayStyle(o);
        return (
          <div
            key={o.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${s.className} ${o.kind === "mention" ? "cursor-pointer pointer-events-auto" : "pointer-events-none"}`}
            style={{ left: `${o.x}%`, top: `${o.y}%`, ...s.style }}
            onClick={o.kind === "mention" && o.uid ? (e) => { e.stopPropagation(); onMention?.(o.uid!); } : undefined}
          >
            {o.kind === "mention" ? `@${o.text}` : o.text}
          </div>
        );
      })}
    </>
  );
}
