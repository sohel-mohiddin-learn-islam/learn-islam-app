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

/** Quoted message shown inside a bubble that replies to another one. */
export function ReplyQuote({ name, text }: { name: string; text: string }) {
  return (
    <div className="mb-1 rounded-lg border-l-4 border-white/60 bg-black/10 px-2 py-1 text-xs opacity-90 max-w-full">
      <div className="font-semibold truncate">{name}</div>
      <div className="line-clamp-2 break-words">{text}</div>
    </div>
  );
}

/** Wraps a chat bubble. Long-press / double-tap opens: reaction bar + Reply, Forward, Copy, Translate, Unsend, Delete for you. */
export function Reactable({ path, uid, mine, reactions, children, text, onReply, onForward, onDeleteMe, onDeleteAll }: {
  path: string[]; uid: string; mine: boolean; reactions?: Record<string, string>; children: ReactNode; text?: string;
  onReply?: () => void; onForward?: () => void; onDeleteMe?: () => void; onDeleteAll?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState("");
  const lp = useLongPress(() => { setConfirm(false); setOpen(true); });
  // swipe a message to the right to reply (like Instagram)
  const [dx, setDx] = useState(0);
  const sw = useRef<{ x: number; y: number; on: boolean } | null>(null);
  const swipe = onReply ? {
    onTouchStart: (e: React.TouchEvent) => { sw.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, on: false }; },
    onTouchMove: (e: React.TouchEvent) => {
      const s0 = sw.current; if (!s0) return;
      const mx = e.touches[0].clientX - s0.x, my = e.touches[0].clientY - s0.y;
      if (!s0.on) { if (Math.abs(mx) > 12 && Math.abs(mx) > Math.abs(my) * 1.5) s0.on = true; else return; }
      setDx(Math.max(0, Math.min(70, mx)));
    },
    onTouchEnd: () => { const go = dx >= 55; sw.current = null; setDx(0); if (go) { try { navigator.vibrate?.(15); } catch { /* ignore */ } onReply?.(); } },
    onTouchCancel: () => { sw.current = null; setDx(0); },
  } : {};
  const pick = (id: string | null) => { reactToMessage(path, uid, id).catch(() => {}); };
  const close = () => { setOpen(false); setConfirm(false); };
  const act = (fn?: () => void) => () => { close(); fn?.(); };
  const copy = async () => {
    close();
    try { await navigator.clipboard.writeText(text || ""); setNote("Copied"); } catch { setNote("Couldn't copy"); }
    window.setTimeout(() => setNote(""), 1500);
  };
  const translate = () => { close(); window.open(`https://translate.google.com/?sl=auto&tl=en&op=translate&text=${encodeURIComponent(text || "")}`, "_blank", "noopener,noreferrer"); };
  const Item = ({ label, icon, onClick, danger }: { label: string; icon: string; onClick: () => void; danger?: boolean }) => (
    <button className={`w-full text-left px-4 py-2.5 flex items-center gap-3 active:bg-muted ${danger ? "text-red-500 font-medium" : ""}`} onClick={onClick}><span className="w-5 text-center">{icon}</span>{label}</button>
  );
  return (
    <div className={`max-w-[78%] flex flex-col ${mine ? "items-end" : "items-start"}`} style={{ WebkitTouchCallout: "none" }}>
      {open && (
        <div className="mb-1 flex flex-col gap-1.5 items-center">
          {!confirm && <ReactionPicker mine={reactions?.[uid]} onPick={pick} onClose={close} />}
          <div className="relative z-[61] rounded-2xl bg-card border border-border shadow-xl overflow-hidden text-sm min-w-[210px]">
            {!confirm ? (
              <>
                {onReply && <Item icon="↩️" label="Reply" onClick={act(onReply)} />}
                {onForward && <Item icon="➡️" label="Forward" onClick={act(onForward)} />}
                {text && <Item icon="📋" label="Copy" onClick={copy} />}
                {text && <Item icon="🌐" label="Translate" onClick={translate} />}
                {onDeleteAll && <Item icon="↩" label="Unsend" danger onClick={() => setConfirm(true)} />}
                {onDeleteMe && <Item icon="🗑️" label="Delete for you" danger onClick={act(onDeleteMe)} />}
              </>
            ) : (
              <>
                <p className="px-4 pt-2.5 pb-1 text-xs text-foreground/60">Unsend this message for everyone?</p>
                <button className="w-full text-left px-4 py-2.5 text-red-500 font-medium active:bg-muted" onClick={act(onDeleteAll)}>Unsend</button>
                <button className="w-full text-left px-4 py-2.5 border-t border-border active:bg-muted" onClick={close}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
      <div {...lp} {...swipe} className="select-none relative" style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? "none" : "transform .18s" }}>
        {dx > 8 && <span className="absolute -left-9 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm" style={{ opacity: Math.min(1, dx / 55) }}>↩</span>}
        {children}
      </div>
      {note && <span className="text-[11px] text-foreground/60">{note}</span>}
      <ReactionChips reactions={reactions} uid={uid} onTap={() => { setConfirm(false); setOpen(true); }} align={mine ? "right" : "left"} />
    </div>
  );
}
