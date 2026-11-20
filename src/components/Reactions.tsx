import { useRef } from "react";
import { REACTIONS, reactionById } from "@/lib/reactions";

export function ReactionGlyph({ id, size = 22 }: { id: string; size?: number }) {
  const r = reactionById(id);
  if (!r) return null;
  if (r.img) return <img src={`${import.meta.env.BASE_URL}reactions/${r.img}`} alt={r.label} style={{ width: size, height: size }} className="inline-block object-contain" draggable={false} />;
  return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{r.emoji}</span>;
}

/** Row of reaction choices; tapping the one you already picked removes it. */
export function ReactionPicker({ mine, onPick, onClose, dark }: { mine?: string; onPick: (id: string | null) => void; onClose: () => void; dark?: boolean }) {
  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div className={`relative z-[61] inline-flex gap-1 rounded-full px-2 py-1.5 shadow-xl border ${dark ? "bg-black/80 border-white/20" : "bg-card border-border"}`}>
        {REACTIONS.map((r) => (
          <button
            key={r.id}
            title={r.label}
            aria-label={r.label}
            onClick={() => { onPick(mine === r.id ? null : r.id); onClose(); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-125 transition-transform ${mine === r.id ? "bg-primary/20" : ""}`}
          >
            <ReactionGlyph id={r.id} size={24} />
          </button>
        ))}
      </div>
    </>
  );
}

/** Small summary under a message: the emojis used and how many people picked each. */
export function ReactionChips({ reactions, uid, onTap, align = "left" }: { reactions?: Record<string, string>; uid: string; onTap: () => void; align?: "left" | "right" }) {
  const list = Object.entries(reactions || {});
  if (!list.length) return null;
  const counts: Record<string, number> = {};
  list.forEach(([, id]) => { counts[id] = (counts[id] || 0) + 1; });
  const mineId = reactions?.[uid];
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"} -mt-1 mb-0.5`}>
      <button onClick={onTap} className="flex items-center gap-1 rounded-full bg-card border border-border px-2 py-0.5 shadow-sm">
        {Object.entries(counts).map(([id, n]) => (
          <span key={id} className={`flex items-center gap-0.5 text-xs ${mineId === id ? "font-bold" : ""}`}>
            <ReactionGlyph id={id} size={14} />{n > 1 ? n : ""}
          </span>
        ))}
      </button>
    </div>
  );
}

/** Long-press (or double-tap) handlers. */
export function useLongPress(cb: () => void, ms = 380) {
  const t = useRef<number | null>(null);
  const moved = useRef(false);
  const clear = () => { if (t.current) { window.clearTimeout(t.current); t.current = null; } };
  return {
    onPointerDown: () => { moved.current = false; clear(); t.current = window.setTimeout(() => { if (!moved.current) cb(); t.current = null; }, ms); },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onPointerMove: () => { moved.current = true; clear(); },
    onDoubleClick: cb,
    onContextMenu: (e: { preventDefault(): void }) => { e.preventDefault(); cb(); },
  };
}

import { useState } from "react";
import type { ReactNode } from "react";
import { reactToMessage } from "@/lib/reactions";

/** Wraps a chat bubble: long-press / double-tap to react; chips show under it. */
export function Reactable({ path, uid, mine, reactions, children }: { path: string[]; uid: string; mine: boolean; reactions?: Record<string, string>; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const lp = useLongPress(() => setOpen(true));
  const pick = (id: string | null) => { reactToMessage(path, uid, id).catch(() => {}); };
  return (
    <div className={`max-w-[78%] flex flex-col ${mine ? "items-end" : "items-start"}`} style={{ WebkitTouchCallout: "none" }}>
      {open && <div className="mb-1"><ReactionPicker mine={reactions?.[uid]} onPick={pick} onClose={() => setOpen(false)} /></div>}
      <div {...lp} className="select-none">{children}</div>
      <ReactionChips reactions={reactions} uid={uid} onTap={() => setOpen(true)} align={mine ? "right" : "left"} />
    </div>
  );
}
